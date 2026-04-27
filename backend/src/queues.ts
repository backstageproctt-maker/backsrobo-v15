import * as Sentry from "@sentry/node";
import BullQueue from "bull";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import Whatsapp from "./models/Whatsapp";
import logger from "./utils/logger";
import moment from "moment";
import Schedule from "./models/Schedule";
import { Op, QueryTypes, Sequelize } from "sequelize";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import Campaign from "./models/Campaign";
import Queues from "./models/Queue";
import ContactList from "./models/ContactList";
import ContactListItem from "./models/ContactListItem";
import { isEmpty, isNil, isArray } from "lodash";
import CampaignSetting from "./models/CampaignSetting";
import CampaignShipping from "./models/CampaignShipping";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import sequelize from "./database";
import { getMessageOptions } from "./services/WbotServices/SendWhatsAppMedia";
import { getIO } from "./libs/socket";
import path from "path";
import User from "./models/User";
import Company from "./models/Company";
import Contact from "./models/Contact";
import Queue from "./models/Queue";
import { ClosedAllOpenTickets } from "./services/WbotServices/wbotClosedTickets";
import Ticket from "./models/Ticket";
import ShowContactService from "./services/ContactServices/ShowContactService";
import UserQueue from "./models/UserQueue";
import ShowTicketService from "./services/TicketServices/ShowTicketService";
import SendWhatsAppMessage from "./services/WbotServices/SendWhatsAppMessage";
import UpdateTicketService from "./services/TicketServices/UpdateTicketService";
import { addSeconds, differenceInSeconds } from "date-fns";
import { GetWhatsapp } from "./helpers/GetWhatsapp";
const CronJob = require("cron").CronJob;
import CompaniesSettings from "./models/CompaniesSettings";
import {
  verifyMediaMessage,
  verifyMessage
} from "./services/WbotServices/wbotMessageListener";
import FindOrCreateTicketService from "./services/TicketServices/FindOrCreateTicketService";
import CreateLogTicketService from "./services/TicketServices/CreateLogTicketService";
import formatBody from "./helpers/Mustache";
import TicketTag from "./models/TicketTag";
import Tag from "./models/Tag";
import { delay } from "baileys";
import Plan from "./models/Plan";
// NOVO: Importações necessárias para a funcionalidade
import ShowFileService from "./services/FileServices/ShowService";
import Files from "./models/Files";

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface CampaignSettings {
  messageInterval: number;
  longerIntervalAfter: number;
  greaterInterval: number;
  variables: any[];
}

interface PrepareContactData {
  contactId: number;
  campaignId: number;
  delay: number;
  variables: any[];
}

interface DispatchCampaignData {
  campaignId: number;
  campaignShippingId: number;
  contactListItemId: number;
}

export const userMonitor = new BullQueue("UserMonitor", connection);
export const scheduleMonitor = new BullQueue("ScheduleMonitor", connection);
export const sendScheduledMessages = new BullQueue(
  "SendSacheduledMessages",
  connection
);
export const campaignQueue = new BullQueue("CampaignQueue", connection);
export const queueMonitor = new BullQueue("QueueMonitor", connection);

export const messageQueue = new BullQueue("MessageQueue", connection, {
  limiter: {
    max: limiterMax as number,
    duration: limiterDuration as number
  }
});

let isProcessing = false;
let lastProcessTime = 0;

// Teste de conexão com o Redis
(async () => {
  try {
    await userMonitor.client.ping();
    logger.info("[Redis] Conexão com Redis UPSTASH estabelecida com sucesso.");
  } catch (err) {
    logger.error(`[Redis] ERRO DE CONEXÃO COM REDIS: ${err.message}`);
    setTimeout(() => {
      const io = getIO();
      if (io) io.emit("campaign-worker-log", { message: `[Redis] ERRO CRÍTICO: Não foi possível conectar ao Upstash. Verifique seu REDIS_URI.` });
    }, 5000);
  }
})();

async function handleSendMessage(job) {
  try {
    const { data } = job;

    const whatsapp = await Whatsapp.findByPk(data.whatsappId);

    if (whatsapp === null) {
      throw Error("Whatsapp não identificado");
    }

    const messageData: MessageData = data.data;

    await SendMessage(whatsapp, messageData);
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("MessageQueue -> SendMessage: error", e.message);
    throw e;
  }
}

async function handleVerifySchedules(job) {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
          // Olha até 24 horas atrás para recuperar agendamentos que
          // foram pulados por causa de atraso no job ou reinicialização
          [Op.gte]: moment().subtract(24, "hours").toDate(),
          [Op.lte]: moment().add("30", "seconds").toDate()
      },
      include: [
        { model: Contact, as: "contact" },
        { model: User, as: "user", attributes: ["name"] }
      ],
      distinct: true,
      subQuery: false
    });

    if (count > 0) {
      schedules.map(async schedule => {
        await schedule.update({
          status: "AGENDADA"
        });
        sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000 }
        );
        logger.info(`Disparo agendado para: ${schedule.contact.name}`);
      });
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SendScheduledMessage -> Verify: error", e.message);
    throw e;
  }
}

async function handleSendScheduledMessage(job) {
  const {
    data: { schedule }
  } = job;
  try {
    scheduleRecord = await Schedule.findByPk(schedule.id, {
      include: [{ model: Contact, as: "contact" }]
    });
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Erro ao tentar consultar agendamento: ${schedule.id}`);
  }

  if (!scheduleRecord) {
    logger.error(`Agendamento ${schedule.id} não encontrado.`);
    return;
  }

  try {
    let whatsapp;

    if (!isNil(schedule.whatsappId)) {
      whatsapp = await Whatsapp.findByPk(schedule.whatsappId);
    }

    if (!whatsapp)
      whatsapp = await GetDefaultWhatsApp(whatsapp.id, schedule.companyId);

    let filePath = null;
    if (schedule.mediaPath) {
      filePath = path.resolve(
        "public",
        `company${schedule.companyId}`,
        schedule.mediaPath
      );
    }

    if (scheduleRecord.openTicket === "enabled") {
      let ticket = await Ticket.findOne({
        where: {
          contactId: scheduleRecord.contact.id,
          companyId: scheduleRecord.companyId,
          whatsappId: whatsapp.id,
          status: ["open", "pending"]
        }
      });

      if (!ticket)
        ticket = await Ticket.create({
          companyId: scheduleRecord.companyId,
          contactId: scheduleRecord.contactId,
          whatsappId: whatsapp.id,
          queueId: scheduleRecord.queueId,
          userId: scheduleRecord.ticketUserId,
          status: scheduleRecord.statusTicket
        });

      ticket = await ShowTicketService(ticket.id, scheduleRecord.companyId);

      let bodyMessage;

      // @ts-ignore: Unreachable code error
      if (scheduleRecord.assinar && !isNil(scheduleRecord.userId)) {
        bodyMessage = `*${scheduleRecord?.user?.name}:*\n${scheduleRecord.body.trim()}`;
      } else {
        bodyMessage = scheduleRecord.body.trim();
      }
      const sentMessage = await SendMessage(
        whatsapp,
        {
          number: scheduleRecord.contact.number,
          body: `\u200e ${formatBody(bodyMessage, ticket)}`,
          mediaPath: filePath,
          companyId: scheduleRecord.companyId
        },
        scheduleRecord.contact.isGroup
      );

      if (scheduleRecord.mediaPath) {
        await verifyMediaMessage(
          sentMessage,
          ticket,
          ticket.contact,
          null,
          true,
          false,
          whatsapp
        );
      } else {
        await verifyMessage(sentMessage, ticket, ticket.contact, null, true, false);
      }
    } else {
      await SendMessage(
        whatsapp,
        {
          number: scheduleRecord.contact.number,
          body: `\u200e ${scheduleRecord.body}`,
          mediaPath: filePath,
          companyId: scheduleRecord.companyId
        },
        scheduleRecord.contact.isGroup
      );
    }

    if (
      schedule.valorIntervalo > 0 &&
      (isNil(schedule.contadorEnvio) ||
        schedule.contadorEnvio < schedule.enviarQuantasVezes)
    ) {
      let unidadeIntervalo;
      switch (schedule.intervalo) {
        case 1:
          unidadeIntervalo = "days";
          break;
        case 2:
          unidadeIntervalo = "weeks";
          break;
        case 3:
          unidadeIntervalo = "months";
          break;
        case 4:
          unidadeIntervalo = "minuts";
          break;
        default:
          throw new Error("Intervalo inválido");
      }

      function isDiaUtil(date) {
        const dayOfWeek = date.day();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // 1 é segunda-feira, 5 é sexta-feira
      }

      function proximoDiaUtil(date) {
        let proximoDia = date.clone();
        do {
          proximoDia.add(1, "day");
        } while (!isDiaUtil(proximoDia));
        return proximoDia;
      }

      function diaUtilAnterior(date) {
        let diaAnterior = date.clone();
        do {
          diaAnterior.subtract(1, "day");
        } while (!isDiaUtil(diaAnterior));
        return diaAnterior;
      }

      const dataExistente = new Date(schedule.sendAt);
      const hora = dataExistente.getHours();
      const fusoHorario = dataExistente.getTimezoneOffset();

      let novaData = new Date(dataExistente);

      console.log(unidadeIntervalo);
      if (unidadeIntervalo !== "minuts") {
        novaData.setDate(
          novaData.getDate() +
            schedule.valorIntervalo *
              (unidadeIntervalo === "days"
                ? 1
                : unidadeIntervalo === "weeks"
                ? 7
                : 30)
        );
      } else {
        novaData.setMinutes(
          novaData.getMinutes() + Number(schedule.valorIntervalo)
        );
        console.log(novaData);
      }

      if (schedule.tipoDias === 5 && !isDiaUtil(novaData)) {
        novaData = diaUtilAnterior(novaData);
      } else if (schedule.tipoDias === 6 && !isDiaUtil(novaData)) {
        novaData = proximoDiaUtil(novaData);
      }

      novaData.setHours(hora);
      novaData.setMinutes(novaData.getMinutes() - fusoHorario);

      await scheduleRecord?.update({
        status: "PENDENTE",
        contadorEnvio: schedule.contadorEnvio + 1,
        sendAt: new Date(
          novaData.toISOString().slice(0, 19).replace("T", " ")
        )
      });
    } else {
      await scheduleRecord?.update({
        sentAt: new Date(moment().format("YYYY-MM-DD HH:mm")),
        status: "ENVIADA"
      });
    }
    logger.info(
      `Mensagem agendada enviada para: ${schedule.contact.name}`
    );
    sendScheduledMessages.clean(15000, "completed");
  } catch (e: any) {
    Sentry.captureException(e);
    await scheduleRecord?.update({
      status: "ERRO"
    });
    logger.error("SendScheduledMessage -> SendMessage: error", e.message);
    throw e;
  }
}

async function handleVerifyCampaigns(job?: any) {
  let io: any;
  try {
    io = getIO();
  } catch (e) {
    logger.error("Socket IO não inicializado");
  }

  try {
    const now = moment();
    
    if (io) {
      const logMsg = { message: `[Vigia] TÔ VIVO! | Servidor: ${now.format("HH:mm:ss")} | Status: Verificando...` };
      // Envia para o root E para todos os namespaces ativos
      io.emit("campaign-worker-log", logMsg);
      if (io.sockets && io.sockets.adapter && io.sockets.adapter.nspNames) {
        for (const nsp of io.sockets.adapter.nspNames) {
           io.of(nsp).emit("campaign-worker-log", logMsg);
        }
      }
    }

    const campaigns = await Campaign.findAll({
      where: {
        status: {
          [Op.in]: ["PROGRAMADA", "Programada", "programada", "EM_ANDAMENTO", "Em andamento"]
        }
      }
    });

    if (io && campaigns.length > 0) {
      const msg = { message: `[Vigia] Campanhas encontradas: ${campaigns.length}` };
      io.emit("campaign-worker-log", msg);
    }

    for (const campaign of campaigns) {
      const scheduledDate = moment(campaign.scheduledAt);
      const diff = scheduledDate.diff(now, 'seconds');

      if (io) {
        const msg = { message: `[Vigia] Campanha: "${campaign.name}" | Agendado: ${scheduledDate.format("DD/MM/YYYY HH:mm:ss")} | Status: ${campaign.status} | Falta: ${diff}s` };
        io.emit("campaign-worker-log", msg);
      }

      // Se a hora já passou ou falta menos de 30 segundos, dispara
      if (diff <= 30) {
        if (io) io.emit("campaign-worker-log", { message: `[Vigia] >>> DISPARANDO AGORA: ${campaign.name} <<<` });
        
        // Garante que o status mude para evitar re-processamento imediato
        await campaign.update({ status: "EM_ANDAMENTO" });

        await campaignQueue.add(
          "ProcessCampaign",
          { id: campaign.id, delay: 0 },
          { 
            priority: 1, 
            jobId: `c-${campaign.id}-${Date.now()}`,
            removeOnComplete: true 
          }
        );
      }
    }
  } catch (err: any) {
    if (io) io.emit("campaign-worker-log", { message: `[Vigia] ERRO NO MOTOR: ${err.message}` });
  } finally {
    isProcessing = false;
  }
}

async function getCampaign(id) {
  return await Campaign.findOne({
    where: { id },
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: [
              "id",
              "name",
              "number",
              "email",
              "isWhatsappValid",
              "isGroup"
            ],
            // Inclui contatos válidos OU não validados (null)
            // Contatos explicitamente inválidos (false) são excluídos
            where: {
              [Op.or]: [
                { isWhatsappValid: true },
                { isWhatsappValid: null }
              ]
            }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: Files,
        as: "fileList"
      }
    ]
  });
}

async function getContact(id) {
  return await ContactListItem.findByPk(id, {
    attributes: ["id", "name", "number", "email", "isGroup"]
  });
}

async function getSettings(campaign): Promise<CampaignSettings> {
  try {
    const settings = await CampaignSetting.findAll({
      where: { companyId: campaign.companyId },
      attributes: ["key", "value"]
    });

    let messageInterval: number = 20;
    let longerIntervalAfter: number = 20;
    let greaterInterval: number = 60;
    let variables: any[] = [];

    settings.forEach(setting => {
      if (setting.key === "messageInterval") {
        messageInterval = JSON.parse(setting.value);
      }
      if (setting.key === "longerIntervalAfter") {
        longerIntervalAfter = JSON.parse(setting.value);
      }
      if (setting.key === "greaterInterval") {
        greaterInterval = JSON.parse(setting.value);
      }
      if (setting.key === "variables") {
        variables = JSON.parse(setting.value);
      }
    });

    return {
      messageInterval,
      longerIntervalAfter,
      greaterInterval,
      variables
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export function parseToMilliseconds(seconds) {
  return seconds * 1000;
}

async function sleep(seconds) {
  logger.info(
    `Sleep de ${seconds} segundos iniciado: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Sleep de ${seconds} segundos finalizado: ${moment().format(
          "HH:mm:ss"
        )}`
      );
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function getCampaignValidMessages(campaign) {
  const messages = [];

  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) {
    messages.push(campaign.message1);
  }

  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) {
    messages.push(campaign.message2);
  }

  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) {
    messages.push(campaign.message3);
  }

  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) {
    messages.push(campaign.message4);
  }

  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) {
    messages.push(campaign.message5);
  }

  return messages;
}

function getCampaignValidConfirmationMessages(campaign) {
  const messages = [];

  if (
    !isEmpty(campaign.confirmationMessage1) &&
    !isNil(campaign.confirmationMessage1)
  ) {
    messages.push(campaign.confirmationMessage1);
  }

  if (
    !isEmpty(campaign.confirmationMessage2) &&
    !isNil(campaign.confirmationMessage2)
  ) {
    messages.push(campaign.confirmationMessage2);
  }

  if (
    !isEmpty(campaign.confirmationMessage3) &&
    !isNil(campaign.confirmationMessage3)
  ) {
    messages.push(campaign.confirmationMessage3);
  }

  if (
    !isEmpty(campaign.confirmationMessage4) &&
    !isNil(campaign.confirmationMessage4)
  ) {
    messages.push(campaign.confirmationMessage4);
  }

  if (
    !isEmpty(campaign.confirmationMessage5) &&
    !isNil(campaign.confirmationMessage5)
  ) {
    messages.push(campaign.confirmationMessage5);
  }

  return messages;
}

function getProcessedMessage(msg: string, variables: any[], contact: any) {
  let finalMessage = msg;

  if (finalMessage.includes("{nome}")) {
    finalMessage = finalMessage.replace(/{nome}/g, contact.name);
  }

  if (finalMessage.includes("{email}")) {
    finalMessage = finalMessage.replace(/{email}/g, contact.email);
  }

  if (finalMessage.includes("{numero}")) {
    finalMessage = finalMessage.replace(/{numero}/g, contact.number);
  }

  if (variables[0]?.value !== "[]") {
    variables.forEach(variable => {
      if (finalMessage.includes(`{${variable.key}}`)) {
        const regex = new RegExp(`{${variable.key}}`, "g");
        finalMessage = finalMessage.replace(regex, variable.value);
      }
    });
  }

  return finalMessage;
}

export function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}

async function verifyAndFinalizeCampaign(campaign) {
  const { companyId, contacts } = campaign.contactList;

  const count1 = contacts.length;

  const count2 = await CampaignShipping.count({
    where: {
      campaignId: campaign.id,
      deliveredAt: {
        [Op.ne]: null
      },
      confirmation: campaign.confirmation ? true : { [Op.or]: [null, false] }
    }
  });

  if (count1 === count2) {
    await campaign.update({ status: "FINALIZADA", completedAt: moment() });
  }

  const io = getIO();
  io.of(companyId).emit(`company-${campaign.companyId}-campaign`, {
    action: "update",
    record: campaign
  });
}

async function handleProcessCampaign(job) {
  const { id }: ProcessCampaignData = job.data;
  let io: any;
  try {
    try { io = getIO(); } catch (e) {}
    if (io) io.emit("campaign-worker-log", { message: `[Motor] Iniciando Campanha ${id}` });

    const campaign = await getCampaign(id);

    if (!campaign) {
      logger.error(`Campanha ${id} não encontrada para processamento.`);
      return;
    }

    if (!campaign.contactList) {
      logger.warn(`Campanha ${id} sem lista de contatos. Finalizando sem envio.`);
      await campaign.update({ status: "FINALIZADA", completedAt: moment() });
      return;
    }

    const settings = await getSettings(campaign);
    const { contacts } = campaign.contactList;

    if (!isArray(contacts) || contacts.length === 0) {
      logger.warn(`Campanha ${id}: lista de contatos está vazia ou sem contatos válidos. Finalizando.`);
      await campaign.update({ status: "FINALIZADA", completedAt: moment() });
      return;
    }

    const contactData = contacts.map(contact => ({
      contactId: contact.id,
      campaignId: campaign.id,
      variables: settings.variables,
      isGroup: contact.isGroup
    }));

    const longerIntervalCount = settings.longerIntervalAfter; // quantidade de contatos
    const greaterInterval = settings.greaterInterval; // segundos
    const messageInterval = settings.messageInterval; // segundos

    // Usa o horario atual como base se a campanha já passou do horario agendado
    const now = new Date();
    const scheduledAt = campaign.scheduledAt ? new Date(campaign.scheduledAt) : now;
    let baseDelay = scheduledAt < now ? now : scheduledAt;

    const queuePromises = [];
    for (let i = 0; i < contactData.length; i++) {
      // Adiciona o intervalo base (em segundos)
      const intervalToAdd = i > longerIntervalCount ? greaterInterval : messageInterval;
      baseDelay = addSeconds(baseDelay, intervalToAdd);

      const { contactId, campaignId, variables } = contactData[i];
      const delay = differenceInSeconds(baseDelay, new Date()) * 1000;
      
      // Garante que o delay não seja negativo
      const finalDelay = delay < 0 ? 0 : delay;

      const queuePromise = campaignQueue.add(
        "PrepareContact",
        { contactId, campaignId, variables, delay: finalDelay },
        { removeOnComplete: true }
      );
      queuePromises.push(queuePromise);
      logger.info(
        `Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contacts[i].name};delay=${delay}`
      );
    }
    await Promise.all(queuePromises);
    logger.info(`Campanha ${id}: ${contactData.length} contatos enfileirados com sucesso.`);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`Erro ao processar campanha: ${err.message}`);
  }
}

function calculateDelay(
  index,
  baseDelay,
  longerIntervalAfter,
  greaterInterval,
  messageInterval
) {
  const diffSeconds = differenceInSeconds(baseDelay, new Date());
  if (index > longerIntervalAfter) {
    return diffSeconds * 1000 + greaterInterval;
  } else {
    return diffSeconds * 1000 + messageInterval;
  }
}

async function handlePrepareContact(job) {
  try {
    const {
      contactId,
      campaignId,
      delay,
      variables
    }: PrepareContactData = job.data;
    const campaign = await getCampaign(campaignId);
    const contact = await getContact(contactId);
    const campaignShipping: any = {};
    campaignShipping.number = contact.number;
    campaignShipping.contactId = contactId;
    campaignShipping.campaignId = campaignId;
    const messages = getCampaignValidMessages(campaign);

    if (messages.length >= 0) {
      const radomIndex = randomValue(0, messages.length);

      const message = getProcessedMessage(
        messages[radomIndex] || "",
        variables,
        contact
      );

      campaignShipping.message =
        message === null ? "" : `\u200c ${message}`;
    }
    if (campaign.confirmation) {
      const confirmationMessages = getCampaignValidConfirmationMessages(
        campaign
      );
      if (confirmationMessages.length) {
        const radomIndex = randomValue(0, confirmationMessages.length);
        const message = getProcessedMessage(
          confirmationMessages[radomIndex] || "",
          variables,
          contact
        );
        campaignShipping.confirmationMessage = `\u200c ${message}`;
      }
    }
    const [record, created] = await CampaignShipping.findOrCreate({
      where: {
        campaignId: campaignShipping.campaignId,
        contactId: campaignShipping.contactId
      },
      defaults: campaignShipping
    });

    if (
      !created &&
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      record.set(campaignShipping);
      await record.save();
    }

    if (
      record.deliveredAt === null &&
      record.confirmationRequestedAt === null
    ) {
      const nextJob = await campaignQueue.add(
        "DispatchCampaign",
        {
          campaignId: campaign.id,
          campaignShippingId: record.id,
          contactListItemId: contactId
        },
        {
          delay
        }
      );

      await record.update({ jobId: String(nextJob.id) });
    }

    await verifyAndFinalizeCampaign(campaign);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`campaignQueue -> PrepareContact -> error: ${err.message}`);
  }
}

async function handleDispatchCampaign(job) {
  try {
    const { data } = job;
    const { campaignShippingId, campaignId }: DispatchCampaignData = data;
    const campaign = await getCampaign(campaignId);
    const wbot = await GetWhatsappWbot(campaign.whatsapp);

    if (!wbot) {
      logger.error(
        `campaignQueue -> DispatchCampaign -> error: wbot not found`
      );
      return;
    }

    if (!campaign.whatsapp) {
      logger.error(
        `campaignQueue -> DispatchCampaign -> error: whatsapp not found`
      );
      return;
    }

    if (!wbot?.user?.id) {
      logger.error(
        `campaignQueue -> DispatchCampaign -> error: wbot user not found`
      );
      return;
    }

    logger.info(
      `Disparo de campanha solicitado: Campanha=${campaignId};Registro=${campaignShippingId}`
    );

    const campaignShipping = await CampaignShipping.findByPk(
      campaignShippingId,
      {
        include: [{ model: ContactListItem, as: "contact" }]
      }
    );

    const chatId = campaignShipping.contact.isGroup
      ? `${campaignShipping.number}@g.us`
      : `${campaignShipping.number}@s.whatsapp.net`;

    if (campaign.openTicket === "enabled") {
      const [contact] = await Contact.findOrCreate({
        where: {
          number: campaignShipping.number,
          companyId: campaign.companyId
        },
        defaults: {
          companyId: campaign.companyId,
          name: campaignShipping.contact.name,
          number: campaignShipping.number,
          email: campaignShipping.contact.email,
          whatsappId: campaign.whatsappId,
          profilePicUrl: ""
        }
      });
      const whatsapp = await Whatsapp.findByPk(campaign.whatsappId);

      let ticket = await Ticket.findOne({
        where: {
          contactId: contact.id,
          companyId: campaign.companyId,
          whatsappId: whatsapp.id,
          status: ["open", "pending"]
        }
      });

      if (!ticket)
        ticket = await Ticket.create({
          companyId: campaign.companyId,
          contactId: contact.id,
          whatsappId: whatsapp.id,
          queueId: campaign?.queueId,
          userId: campaign?.userId,
          status: campaign?.statusTicket
        });

      ticket = await ShowTicketService(ticket.id, campaign.companyId);

      if (campaign.tagListId) {
        await TicketTag.findOrCreate({
          where: { ticketId: ticket.id, tagId: campaign.tagListId }
        });
      }

      if (whatsapp.status === "CONNECTED") {
        if (campaign.confirmation && campaignShipping.confirmation === null) {
          const confirmationMessage = await wbot.sendMessage(chatId, {
            text: `\u200c ${campaignShipping.confirmationMessage}`
          });

          await verifyMessage(
            confirmationMessage,
            ticket,
            contact,
            null,
            true,
            false
          );

          await campaignShipping.update({
            confirmationRequestedAt: moment()
          });
        } else {
          // Verifica se existe mídia (lista de arquivos ou anexo direto).
          // Se existir, NÃO envia o texto separado para evitar duplicidade;
          // o texto será usado apenas como legenda.
          const hasFileList = !isNil(campaign.fileListId);
          const hasDirectMedia = !!campaign.mediaPath;
          const shouldSendTextOnly = !hasFileList && !hasDirectMedia;

          // Envio da mensagem de texto principal (somente quando não há mídia)
          if (
            shouldSendTextOnly &&
            campaignShipping.message &&
            campaignShipping.message.trim() !== "\u200c"
          ) {
            const sentMessage = await wbot.sendMessage(chatId, {
              text: `\u200c ${campaignShipping.message}`
            });

            await verifyMessage(
              sentMessage,
              ticket,
              contact,
              null,
              true,
              false
            );
          }

          // NOVO CÓDIGO: Lógica para enviar a lista de arquivos
          if (!isNil(campaign.fileListId)) {
            try {
              const files = await ShowFileService(
                campaign.fileListId,
                campaign.companyId
              );
              const publicFolder = path.resolve(__dirname, "..", "public");
              const folder = path.resolve(
                publicFolder,
                `company${campaign.companyId}`,
                "fileList",
                String(files.id)
              );

              for (const file of files.options) {
                const filePath = path.resolve(folder, file.path);
                // Adicionamos a mensagem da lista de arquivos ("files.message") como legenda
                const options = await getMessageOptions(
                  file.name,
                  filePath,
                  String(campaign.companyId),
                  `\u200c ${files.message}`
                );
                if (Object.keys(options).length) {
                  const sentMediaMessage = await wbot.sendMessage(chatId, {
                    ...options
                  });
                  await verifyMediaMessage(
                    sentMediaMessage,
                    ticket,
                    contact,
                    null,
                    true,
                    false,
                    wbot
                  );
                }
              }
            } catch (err: any) {
              Sentry.captureException(err);
              logger.error(
                `Error sending file list media (ticket enabled): ${err.message}`
              );
            }
          }
          // FIM DO NOVO CÓDIGO

          // Lógica para anexo direto (mediaPath)
          if (campaign.mediaPath) {
            const publicFolder = path.resolve(__dirname, "..", "public");
            const filePath = path.join(
              publicFolder,
              `company${campaign.companyId}`,
              campaign.mediaPath
            );

            const options = await getMessageOptions(
              campaign.mediaName,
              filePath,
              String(campaign.companyId),
              `\u200c ${campaignShipping.message}`
            );
            if (Object.keys(options).length) {
              // Para áudio, o WhatsApp não usa legenda, então enviamos o texto separado
              if (
                "mimetype" in options &&
                typeof (options as any).mimetype === "string" &&
                (options as any).mimetype.startsWith("audio/")
              ) {
                const audioMessage = await wbot.sendMessage(chatId, {
                  text: `\u200c ${campaignShipping.message}`
                });

                await verifyMessage(
                  audioMessage,
                  ticket,
                  contact,
                  null,
                  true,
                  false
                );
              }
              const sentMessage = await wbot.sendMessage(chatId, {
                ...options
              });

              await verifyMediaMessage(
                sentMessage,
                ticket,
                ticket.contact,
                null,
                false,
                true,
                wbot
              );
            }
          }
        }
        await campaignShipping.update({ deliveredAt: moment() });
      }
    } else {
      if (campaign.confirmation && campaignShipping.confirmation === null) {
        await wbot.sendMessage(chatId, {
          text: campaignShipping.confirmationMessage
        });
        await campaignShipping.update({
          confirmationRequestedAt: moment()
        });
      } else {
        // Mesmo conceito do bloco acima: se houver mídia, o texto vai só na legenda
        const hasFileList = !isNil(campaign.fileListId);
        const hasDirectMedia = !!campaign.mediaPath;
        const shouldSendTextOnly = !hasFileList && !hasDirectMedia;

        // Envio da mensagem de texto principal (somente se não tiver mídia)
        if (
          shouldSendTextOnly &&
          campaignShipping.message &&
          campaignShipping.message.trim() !== "\u200c"
        ) {
          await wbot.sendMessage(chatId, {
            text: campaignShipping.message
          });
        }

        // NOVO CÓDIGO: Lógica para enviar a lista de arquivos
        if (!isNil(campaign.fileListId)) {
          try {
            const files = await ShowFileService(
              campaign.fileListId,
              campaign.companyId
            );
            const publicFolder = path.resolve(__dirname, "..", "public");
            const folder = path.resolve(
              publicFolder,
              `company${campaign.companyId}`,
              "fileList",
              String(files.id)
            );

            for (const file of files.options) {
              const filePath = path.resolve(folder, file.path);
              // Adicionamos a mensagem da lista de arquivos ("files.message") como legenda
              const options = await getMessageOptions(
                file.name,
                filePath,
                String(campaign.companyId),
                files.message
              );
              if (Object.keys(options).length) {
                await wbot.sendMessage(chatId, { ...options });
              }
            }
          } catch (err: any) {
            Sentry.captureException(err);
            logger.error(
              `Error sending file list media (ticket disabled): ${err.message}`
            );
          }
        }
        // FIM DO NOVO CÓDIGO

        // Lógica para anexo direto (mediaPath)
        if (campaign.mediaPath) {
          const publicFolder = path.resolve(__dirname, "..", "public");
          const filePath = path.join(
            publicFolder,
            `company${campaign.companyId}`,
            campaign.mediaPath
          );

          const options = await getMessageOptions(
            campaign.mediaName,
            filePath,
            String(campaign.companyId),
            campaignShipping.message
          );
          if (Object.keys(options).length) {
            if (
              "mimetype" in options &&
              typeof (options as any).mimetype === "string" &&
              (options as any).mimetype.startsWith("audio/")
            ) {
              await wbot.sendMessage(chatId, {
                text: campaignShipping.message
              });
            }
            await wbot.sendMessage(chatId, { ...options });
          }
        }
      }

      await campaignShipping.update({ deliveredAt: moment() });
    }
    await verifyAndFinalizeCampaign(campaign);

    const io = getIO();
    io.of(String(campaign.companyId)).emit(
      `company-${campaign.companyId}-campaign`,
      {
        action: "update",
        record: campaign
      }
    );

    logger.info(
      `Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`
    );
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(err.message);
    console.log(err.stack);
  }
}

async function handleLoginStatus(job) {
  const thresholdTime = new Date();
  thresholdTime.setMinutes(thresholdTime.getMinutes() - 5);

  await User.update(
    { online: false },
    {
      where: {
        updatedAt: { [Op.lt]: thresholdTime },
        online: true
      }
    }
  );
}

async function handleResumeTicketsOutOfHour(job) {
  try {
    const companies = await Company.findAll({
      attributes: ["id", "name"],
      where: {
        status: true
      },
      include: [
        {
          model: Whatsapp,
          attributes: ["id", "name", "status", "timeSendQueue", "sendIdQueue"],
          where: {
            timeSendQueue: { [Op.gt]: 0 }
          }
        }
      ]
    });

    companies.map(async c => {
      c.whatsapps.map(async w => {
        if (w.status === "CONNECTED") {
          var companyId = c.id;

          const moveQueue = w.timeSendQueue ? w.timeSendQueue : 0;
          const moveQueueId = w.sendIdQueue;
          const moveQueueTime = moveQueue;
          const idQueue = moveQueueId;
          const timeQueue = moveQueueTime;

          if (moveQueue > 0) {
            if (
              !isNaN(idQueue) &&
              Number.isInteger(idQueue) &&
              !isNaN(timeQueue) &&
              Number.isInteger(timeQueue)
            ) {
              const tempoPassado = moment()
                .subtract(timeQueue, "minutes")
                .utc()
                .format();

              const { count, rows: tickets } = await Ticket.findAndCountAll({
                attributes: ["id"],
                where: {
                  status: "pending",
                  queueId: null,
                  companyId: companyId,
                  whatsappId: w.id,
                  updatedAt: {
                    [Op.lt]: tempoPassado
                  }
                },
                include: [
                  {
                    model: Contact,
                    as: "contact",
                    attributes: [
                      "id",
                      "name",
                      "number",
                      "email",
                      "profilePicUrl",
                      "acceptAudioMessage",
                      "active",
                      "disableBot",
                      "urlPicture",
                      "lgpdAcceptedAt",
                      "companyId"
                    ],
                    include: ["extraInfo", "tags"]
                  },
                  {
                    model: Queue,
                    as: "queue",
                    attributes: ["id", "name", "color"]
                  },
                  {
                    model: Whatsapp,
                    as: "whatsapp",
                    attributes: ["id", "name", "expiresTicket", "groupAsTicket"]
                  }
                ]
              });

              if (count > 0) {
                tickets.map(async ticket => {
                  await ticket.update({
                    queueId: idQueue
                  });

                  await ticket.reload();

                  const io = getIO();
                  io.of(String(companyId)).emit(
                    `company-${companyId}-ticket`,
                    {
                      action: "update",
                      ticket,
                      ticketId: ticket.id
                    }
                  );

                  logger.info(
                    `Atendimento Perdido: ${ticket.id} - Empresa: ${companyId}`
                  );
                });
              }
            } else {
              logger.info(
                `Condição não respeitada - Empresa: ${companyId}`
              );
            }
          }
        }
      });
    });
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SearchForQueue -> VerifyQueue: error", e.message);
    throw e;
  }
}

async function handleVerifyQueue(job) {
  try {
    const companies = await Company.findAll({
      attributes: ["id", "name"],
      where: {
        status: true
      },
      include: [
        {
          model: Whatsapp,
          attributes: ["id", "name", "status", "timeSendQueue", "sendIdQueue"]
        }
      ]
    });

    companies.map(async c => {
      c.whatsapps.map(async w => {
        if (w.status === "CONNECTED") {
          var companyId = c.id;

          const moveQueue = w.timeSendQueue ? w.timeSendQueue : 0;
          const moveQueueId = w.sendIdQueue;
          const moveQueueTime = moveQueue;
          const idQueue = moveQueueId;
          const timeQueue = moveQueueTime;

          if (moveQueue > 0) {
            if (
              !isNaN(idQueue) &&
              Number.isInteger(idQueue) &&
              !isNaN(timeQueue) &&
              Number.isInteger(timeQueue)
            ) {
              const tempoPassado = moment()
                .subtract(timeQueue, "minutes")
                .utc()
                .format();

              const { count, rows: tickets } = await Ticket.findAndCountAll({
                attributes: ["id"],
                where: {
                  status: "pending",
                  queueId: null,
                  companyId: companyId,
                  whatsappId: w.id,
                  updatedAt: {
                    [Op.lt]: tempoPassado
                  }
                },
                include: [
                  {
                    model: Contact,
                    as: "contact",
                    attributes: [
                      "id",
                      "name",
                      "number",
                      "email",
                      "profilePicUrl",
                      "acceptAudioMessage",
                      "active",
                      "disableBot",
                      "urlPicture",
                      "lgpdAcceptedAt",
                      "companyId"
                    ],
                    include: ["extraInfo", "tags"]
                  },
                  {
                    model: Queue,
                    as: "queue",
                    attributes: ["id", "name", "color"]
                  },
                  {
                    model: Whatsapp,
                    as: "whatsapp",
                    attributes: ["id", "name", "expiresTicket", "groupAsTicket"]
                  }
                ]
              });

              if (count > 0) {
                tickets.map(async ticket => {
                  await ticket.update({
                    queueId: idQueue
                  });

                  await CreateLogTicketService({
                    userId: null,
                    queueId: idQueue,
                    ticketId: ticket.id,
                    type: "redirect"
                  });

                  await ticket.reload();

                  const io = getIO();
                  io.of(String(companyId)).emit(
                    `company-${companyId}-ticket`,
                    {
                      action: "update",
                      ticket,
                      ticketId: ticket.id
                    }
                  );

                  logger.info(
                    `Atendimento Perdido: ${ticket.id} - Empresa: ${companyId}`
                  );
                });
              }
            } else {
              logger.info(
                `Condição não respeitada - Empresa: ${companyId}`
              );
            }
          }
        }
      });
    });
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SearchForQueue -> VerifyQueue: error", e.message);
    throw e;
  }
}
async function handleRandomUser() {
  const jobR = new CronJob("0 */2 * * * *", async () => {
    try {
      const companies = await Company.findAll({
        attributes: ["id", "name"],
        where: {
          status: true
        },
        include: [
          {
            model: Queues,
            attributes: ["id", "name", "ativarRoteador", "tempoRoteador"],
            where: {
              ativarRoteador: true,
              tempoRoteador: {
                [Op.ne]: 0
              }
            }
          }
        ]
      });

      if (companies) {
        companies.map(async c => {
          c.queues.map(async q => {
            const { count, rows: tickets } = await Ticket.findAndCountAll({
              where: {
                companyId: c.id,
                status: "pending",
                queueId: q.id
              }
            });

            const getRandomUserId = userIds => {
              const randomIndex = Math.floor(Math.random() * userIds.length);
              return userIds[randomIndex];
            };

            const findUserById = async (userId, companyId) => {
              try {
                const user = await User.findOne({
                  where: {
                    id: userId,
                    companyId
                  }
                });

                if (user && user?.profile === "user") {
                  if (user.online === true) {
                    return user.id;
                  } else {
                    return 0;
                  }
                } else {
                  return 0;
                }
              } catch (errorV: any) {
                Sentry.captureException(errorV);
                logger.error(
                  "SearchForUsersRandom -> VerifyUsersRandom: error",
                  errorV.message
                );
                throw errorV;
              }
            };

            if (count > 0) {
              for (const ticket of tickets) {
                const { queueId, userId } = ticket;
                const tempoRoteador = q.tempoRoteador;

                const userQueues = await UserQueue.findAll({
                  where: {
                    queueId: queueId
                  }
                });

                const contact = await ShowContactService(
                  ticket.contactId,
                  ticket.companyId
                );

                const userIds = userQueues.map(
                  userQueue => userQueue.userId
                );

                const tempoPassadoB = moment()
                  .subtract(tempoRoteador, "minutes")
                  .utc()
                  .toDate();
                const updatedAtV = new Date(ticket.updatedAt);

                let settings = await CompaniesSettings.findOne({
                  where: {
                    companyId: ticket.companyId
                  }
                });
                const sendGreetingMessageOneQueues =
                  settings.sendGreetingMessageOneQueues === "enabled" ||
                  false;

                if (!userId) {
                  const randomUserId = getRandomUserId(userIds);

                  if (
                    randomUserId !== undefined &&
                    (await findUserById(
                      randomUserId,
                      ticket.companyId
                    )) > 0
                  ) {
                    if (sendGreetingMessageOneQueues) {
                      const ticketToSend = await ShowTicketService(
                        ticket.id,
                        ticket.companyId
                      );

                      await SendWhatsAppMessage({
                        body: `\u200e *Assistente Virtual*:\nAguarde enquanto localizamos um atendente... Você será atendido em breve!`,
                        ticket: ticketToSend
                      });
                    }

                    await UpdateTicketService({
                      ticketData: {
                        status: "pending",
                        userId: randomUserId
                      },
                      ticketId: ticket.id,
                      companyId: ticket.companyId
                    });

                    logger.info(
                      `Ticket ID ${ticket.id} atualizado para UserId ${randomUserId} - ${ticket.updatedAt}`
                    );
                  }
                } else if (userIds.includes(userId)) {
                  if (tempoPassadoB > updatedAtV) {
                    const availableUserIds = userIds.filter(
                      id => id !== userId
                    );

                    if (availableUserIds.length > 0) {
                      const randomUserId = getRandomUserId(
                        availableUserIds
                      );

                      if (
                        randomUserId !== undefined &&
                        (await findUserById(
                          randomUserId,
                          ticket.companyId
                        )) > 0
                      ) {
                        if (sendGreetingMessageOneQueues) {
                          const ticketToSend = await ShowTicketService(
                            ticket.id,
                            ticket.companyId
                          );
                          await SendWhatsAppMessage({
                            body:
                              "*Assistente Virtual*:\nAguarde enquanto localizamos um atendente... Você será atendido em breve!",
                            ticket: ticketToSend
                          });
                        }

                        await UpdateTicketService({
                          ticketData: {
                            status: "pending",
                            userId: randomUserId
                          },
                          ticketId: ticket.id,
                          companyId: ticket.companyId
                        });

                        logger.info(
                          `Ticket ID ${ticket.id} atualizado para UserId ${randomUserId} - ${ticket.updatedAt}`
                        );
                      }
                    }
                  }
                }
              }
            }
          });
        });
      }
    } catch (e: any) {
      Sentry.captureException(e);
      logger.error(
        "SearchForUsersRandom -> VerifyUsersRandom: error",
        e.message
      );
      throw e;
    }
  });

  jobR.start();
}

async function handleProcessLanes() {
  const job = new CronJob("*/1 * * * *", async () => {
    const companies = await Company.findAll({
      include: [
        {
          model: Plan,
          as: "plan",
          attributes: ["id", "name", "useKanban"],
          where: {
            useKanban: true
          }
        }
      ]
    });
    companies.map(async c => {
      try {
        const companyId = c.id;

        const ticketTags = await TicketTag.findAll({
          include: [
            {
              model: Ticket,
              as: "ticket",
              where: {
                status: "open",
                fromMe: true,
                companyId
              },
              attributes: ["id", "contactId", "updatedAt", "whatsappId"]
            },
            {
              model: Tag,
              as: "tag",
              attributes: [
                "id",
                "timeLane",
                "nextLaneId",
                "greetingMessageLane"
              ],
              where: {
                companyId
              }
            }
          ]
        });

        if (ticketTags.length > 0) {
          ticketTags.map(async t => {
            if (
              !isNil(t?.tag.nextLaneId) &&
              t?.tag.nextLaneId > 0 &&
              t?.tag.timeLane > 0
            ) {
              const nextTag = await Tag.findByPk(t?.tag.nextLaneId);

              const dataLimite = new Date();
              dataLimite.setHours(
                dataLimite.getHours() - Number(t.tag.timeLane)
              );
              const dataUltimaInteracaoChamado = new Date(
                t.ticket.updatedAt
              );

              if (dataUltimaInteracaoChamado < dataLimite) {
                await TicketTag.destroy({
                  where: { ticketId: t.ticketId, tagId: t.tagId }
                });
                await TicketTag.create({
                  ticketId: t.ticketId,
                  tagId: nextTag.id
                });

                const whatsapp = await Whatsapp.findByPk(
                  t.ticket.whatsappId
                );

                if (
                  !isNil(nextTag.greetingMessageLane) &&
                  nextTag.greetingMessageLane !== ""
                ) {
                  const bodyMessage = nextTag.greetingMessageLane;

                  const contact = await Contact.findByPk(
                    t.ticket.contactId
                  );
                  const ticketUpdate = await ShowTicketService(
                    t.ticketId,
                    companyId
                  );

                  await SendMessage(
                    whatsapp,
                    {
                      number: contact.number,
                      body: `${formatBody(bodyMessage, ticketUpdate)}`,
                      mediaPath: null,
                      companyId: companyId
                    },
                    contact.isGroup
                  );
                }
              }
            }
          });
        }
      } catch (e: any) {
        Sentry.captureException(e);
        logger.error("Process Lanes -> Verify: error", e.message);
        throw e;
      }
    });
  });
  job.start();
}

async function handleCloseTicketsAutomatic() {
  const job = new CronJob("*/1 * * * *", async () => {
    const companies = await Company.findAll({
      where: {
        status: true
      }
    });
    companies.map(async c => {
      try {
        const companyId = c.id;
        await ClosedAllOpenTickets(companyId);
      } catch (e: any) {
        Sentry.captureException(e);
        logger.error("ClosedAllOpenTickets -> Verify: error", e.message);
        throw e;
      }
    });
  });
  job.start();
}

async function handleWhatsapp() {
  const jobW = new CronJob(
    "* 15 3 * * *",
    async () => {
      GetWhatsapp();
      jobW.stop();
    },
    null,
    false,
    "America/Sao_Paulo"
  );
  jobW.start();
}

async function handleInvoiceCreate() {
  const job = new CronJob("0 * * * * *", async () => {
    const companies = await Company.findAll();
    companies.map(async c => {
      var dueDate = c.dueDate;
      const date = moment(dueDate).format();
      const timestamp = moment().format();
      const hoje = moment(moment()).format("DD/MM/yyyy");
      var vencimento = moment(dueDate).format("DD/MM/yyyy");

      var diff = moment(vencimento, "DD/MM/yyyy").diff(
        moment(hoje, "DD/MM/yyyy")
      );
      var dias = moment.duration(diff).asDays();

      if (dias < 20) {
        const plan = await Plan.findByPk(c.planId);

        const sql = `SELECT COUNT(*) mycount FROM "Invoices" WHERE "companyId" = ${
          c.id
        } AND "dueDate"::text LIKE '${moment(dueDate).format(
          "yyyy-MM-DD"
        )}%';`;
        const invoice = await sequelize.query(sql, {
          type: QueryTypes.SELECT
        });
        if (invoice[0]["mycount"] > 0) {
          // já existe
        } else {
          const sqlInsert = `INSERT INTO "Invoices" (detail, status, value, "updatedAt", "createdAt", "dueDate", "companyId")
          VALUES ('${plan.name}', 'open', '${plan.amount}', '${timestamp}', '${timestamp}', '${date}', ${c.id});`;

          await sequelize.query(sqlInsert, {
            type: QueryTypes.INSERT
          });
        }
      }
    });
  });
  job.start();
}

handleInvoiceCreate();
handleWhatsapp();
handleProcessLanes();
handleCloseTicketsAutomatic();
handleRandomUser();

export async function startQueueProcess() {
  logger.info("Iniciando processamento de filas");

  messageQueue.process("SendMessage", handleSendMessage);

  scheduleMonitor.process("Verify", handleVerifySchedules);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  campaignQueue.process("VerifyCampaignsDatabase", handleVerifyCampaigns);

  campaignQueue.process("ProcessCampaign", handleProcessCampaign);

  campaignQueue.process("PrepareContact", handlePrepareContact);

  campaignQueue.process("DispatchCampaign", handleDispatchCampaign);

  userMonitor.process("VerifyLoginStatus", handleLoginStatus);

  queueMonitor.process("VerifyQueueStatus", handleVerifyQueue);

  scheduleMonitor.add(
    "Verify",
    {},
    {
      repeat: { cron: "0 * * * * *", key: "verify" },
      removeOnComplete: true
    }
  );

  // Inicia o intervalo de verificação de campanhas (Fail-safe)
  messageQueue.resume(); // Garante que a fila não inicie pausada
  setInterval(() => {
    handleVerifyCampaigns();
  }, 10000); // 10 segundos para feedback rápido no diagnóstico

  userMonitor.add(
    "VerifyLoginStatus",
    {},
    {
      repeat: { cron: "* * * * *", key: "verify-login" },
      removeOnComplete: true
    }
  );

  queueMonitor.add(
    "VerifyQueueStatus",
    {},
    {
      repeat: { cron: "0 * * * * *", key: "verify-queue" },
      removeOnComplete: true
    }
  );
}
