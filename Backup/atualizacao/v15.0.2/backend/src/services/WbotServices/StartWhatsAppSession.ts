import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import * as Sentry from "@sentry/node";

const sessionStartLocks = new Map<number, number>();
const START_LOCK_TTL_MS = 120_000;

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  const lockAt = sessionStartLocks.get(whatsapp.id);
  if (lockAt && Date.now() - lockAt < START_LOCK_TTL_MS) {
    logger.warn(
      `Session ${whatsapp.id} start já em andamento; ignorando chamada duplicada`
    );
    return;
  }
  if (lockAt) {
    logger.warn(`Session ${whatsapp.id} lock antigo detectado; liberando lock`);
  }
  sessionStartLocks.set(whatsapp.id, Date.now());

  try {
    await whatsapp.update({ status: "OPENING" });

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-whatsappSession`, {
      action: "update",
      session: whatsapp
    });

    const wbot = await initWASocket(whatsapp);
    if (wbot) {
      wbotMessageListener(wbot, companyId);
      wbotMonitor(wbot, whatsapp, companyId);
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
    try {
      const current = await Whatsapp.findByPk(whatsapp.id);
      if (current?.status === "OPENING") {
        await current.update({ status: "DISCONNECTED", qrcode: "" });
        const io = getIO();
        io.of(String(companyId)).emit(`company-${companyId}-whatsappSession`, {
          action: "update",
          session: current
        });
      }
    } catch (updateErr) {
      logger.error(updateErr);
    }
  } finally {
    sessionStartLocks.delete(whatsapp.id);
  }
};
