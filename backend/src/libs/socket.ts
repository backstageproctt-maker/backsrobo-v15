import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import AppError from "../errors/AppError";
import logger from "../utils/logger";
import { instrument } from "@socket.io/admin-ui";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Define namespaces permitidos
const ALLOWED_NAMESPACES = /^\/workspace-\d+$|^\/$/;

// Esquemas de validação
const userIdSchema = z.string().uuid().optional();
const ticketIdSchema = z.string().uuid();
const statusSchema = z.enum(["open", "closed", "pending"]);
const jwtPayloadSchema = z.object({
  userId: z.string().uuid(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

// Origens CORS permitidas
const ALLOWED_ORIGINS = ["*"]; // Liberar geral para evitar bloqueio no Vercel/Render

// Ajuste da classe AppError para compatibilidade com Error
class SocketCompatibleAppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = "AppError";
    // Garante que a stack trace seja capturada
    Error.captureStackTrace?.(this, SocketCompatibleAppError);
  }
}

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: "*", // Liberar geral para evitar bloqueio no Vercel/Render
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 1e6, // Limita payload a 1MB
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Admin UI apenas em desenvolvimento
  const isAdminEnabled = process.env.SOCKET_ADMIN === "true" && process.env.NODE_ENV !== "production";
  if (isAdminEnabled && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    try {
      instrument(io, {
        auth: {
          type: "basic",
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD,
        },
        mode: "development",
        readonly: true,
      });
      logger.info("Socket.IO Admin UI inicializado em modo de desenvolvimento");
    } catch (error) {
      logger.error("Falha ao inicializar Socket.IO Admin UI", error);
    }
  } else if (isAdminEnabled) {
    logger.warn("Credenciais de administrador ausentes, Admin UI não inicializado");
  }

  // Namespaces dinâmicos - ABERTO PARA DIAGNÓSTICO
  const workspaces = io.of((name, auth, next) => {
    next(null, true);
  });

  workspaces.on("connection", (socket) => {
    const clientIp = socket.handshake.address;

    logger.info(`Cliente conectado ao namespace ${socket.nsp.name} (IP: ${clientIp})`);

    socket.on("joinChatBox", (ticketId: string, callback: (error?: string) => void) => {
      try {
        const validatedTicketId = ticketIdSchema.parse(ticketId);
        socket.join(validatedTicketId);
        logger.info(`Cliente entrou no canal de ticket ${validatedTicketId} no namespace ${socket.nsp.name}`);
        callback();
      } catch (error) {
        logger.warn(`ticketId inválido: ${ticketId}`);
        callback("ID de ticket inválido");
      }
    });

    socket.on("joinNotification", (callback: (error?: string) => void) => {
      socket.join("notification");
      logger.info(`Cliente entrou no canal de notificações no namespace ${socket.nsp.name}`);
      callback();
    });

    socket.on("joinTickets", (status: string, callback: (error?: string) => void) => {
      try {
        const validatedStatus = statusSchema.parse(status);
        socket.join(validatedStatus);
        logger.info(`Cliente entrou no canal ${validatedStatus} no namespace ${socket.nsp.name}`);
        callback();
      } catch (error) {
        logger.warn(`Status inválido: ${status}`);
        callback("Status inválido");
      }
    });

    socket.on("joinTicketsLeave", (status: string, callback: (error?: string) => void) => {
      try {
        const validatedStatus = statusSchema.parse(status);
        socket.leave(validatedStatus);
        logger.info(`Cliente saiu do canal ${validatedStatus} no namespace ${socket.nsp.name}`);
        callback();
      } catch (error) {
        logger.warn(`Status inválido: ${status}`);
        callback("Status inválido");
      }
    });

    socket.on("joinChatBoxLeave", (ticketId: string, callback: (error?: string) => void) => {
      try {
        const validatedTicketId = ticketIdSchema.parse(ticketId);
        socket.leave(validatedTicketId);
        logger.info(`Cliente saiu do canal de ticket ${validatedTicketId} no namespace ${socket.nsp.name}`);
        callback();
      } catch (error) {
        logger.warn(`ticketId inválido: ${ticketId}`);
        callback("ID de ticket inválido");
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Cliente desconectado do namespace ${socket.nsp.name} (IP: ${clientIp})`);
    });

    socket.on("error", (error) => {
      logger.error(`Erro no socket do namespace ${socket.nsp.name}: ${error.message}`);
    });
  });

  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new SocketCompatibleAppError("Socket IO não inicializado", 500);
  }
  return io;
};