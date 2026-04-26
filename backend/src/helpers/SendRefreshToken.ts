import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  res.cookie("jrt", token, { 
    httpOnly: true,
    secure: true, // Necessário para HTTPS e Cross-Site
    sameSite: "none" // Permite que a Vercel fale com o Render
  });
};
