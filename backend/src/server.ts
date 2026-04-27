// Forçar fuso horário de Brasília ANTES de qualquer import
process.env.TZ = 'America/Sao_Paulo';
import 'dotenv/config';
import moment from "moment";
import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import logger from "./utils/logger";
import Whatsapp from "./models/Whatsapp";
import BullQueue from './libs/queue';
import { startQueueProcess } from "./queues";
import { StartWhatsAppSession } from "./services/WbotServices/StartWhatsAppSession";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, async () => {
  try {
    // 1. Busca no banco todas as conexões que deveriam estar ativas
    const whatsapps = await Whatsapp.findAll({
      where: { status: "CONNECTED" }
    });

    logger.info(
      `✅ Servidor iniciado. Tentando reconectar ${whatsapps.length} sessões.`
    );

    // 2. Tenta iniciar cada uma delas
    if (whatsapps.length > 0) {
      for (const wpp of whatsapps) {
        // Cálculo manual de fuso (UTC - 3) se o servidor estiver em UTC
        const now = moment().subtract(0, 'hours'); // O TZ=America/Sao_Paulo já deve cuidar disso no Linux
        
        if (typeof io !== 'undefined') {
          const logMsg = { message: `[Vigia] TÔ VIVO! | Servidor: ${now.format("HH:mm:ss")} | TZ: ${process.env.TZ}` };
          io.emit("campaign-worker-log", logMsg);
        }    
        
        // Adiciona um pequeno atraso para não sobrecarregar a API do WhatsApp
        await new Promise(r => setTimeout(r, 1000));
        logger.info(`Tentando reconectar: ${wpp.name}`);
        StartWhatsAppSession(wpp, wpp.companyId);
      }
    }

    // 3. Inicia as filas (como já fazia)
    await startQueueProcess();
  } catch (err) {
    logger.error("Erro no startup do servidor", err);
  }

  if (process.env.REDIS_URI_ACK && process.env.REDIS_URI_ACK !== "") {
    BullQueue.process();
  }

  logger.info(`Server started on ${HOST}:${PORT}`);
});

process.on("uncaughtException", err => {
  console.error(`${new Date().toUTCString()} uncaughtException:`, err.message);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason, p) => {
  console.error(`${new Date().toUTCString()} unhandledRejection:`, reason, p);
});

initIO(server);
gracefulShutdown(server);