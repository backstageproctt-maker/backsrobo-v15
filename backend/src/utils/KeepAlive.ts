import axios from "axios";

const KeepAlive = () => {
  const url = process.env.BACKEND_URL || "https://backsrobo-v15.onrender.com";
  
  console.log(`[KeepAlive] Despertador ativado para: ${url}/health`);

  // Toca a campainha a cada 5 minutos (300.000 milissegundos)
  setInterval(async () => {
    try {
      await axios.get(`${url}/health`);
      console.log(`[KeepAlive] Cutucada no motor realizada com sucesso! ☕`);
    } catch (err) {
      console.log(`[KeepAlive] Erro ao cutucar o motor:`, err.message);
    }
  }, 300000); 
};

export default KeepAlive;
