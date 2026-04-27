import openSocket from "socket.io-client";
import { isObject } from "lodash";
import SocketWorker from "./SocketWorker"

export function socketConnection(params, unused, isRoot = false) {
  let userId = "";
  let companyId = "";
  
  if (isRoot) {
    return SocketWorker(null, null); // Conecta ao root
  }

  if (isObject(params)){
    companyId = params?.user?.companyId
    userId = params?.user?.id
  }
 
  return SocketWorker(companyId,userId)
}