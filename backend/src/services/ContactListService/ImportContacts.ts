import { head } from "lodash";
import XLSX from "xlsx";
import { has } from "lodash";
import ContactListItem from "../../models/ContactListItem";
import CheckContactNumber from "../WbotServices/CheckNumber";
import logger from "../../utils/logger";
// import CheckContactNumber from "../WbotServices/CheckNumber";

export async function ImportContacts(
  contactListId: number,
  companyId: number,
  file: Express.Multer.File | undefined
) {
  const workbook = XLSX.readFile(file?.path as string);
  const worksheet = head(Object.values(workbook.Sheets)) as any;
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
  const contacts = rows.map(row => {
    let name = "";
    let number = "";
    let email = "";

    if (has(row, "nome") || has(row, "Nome")) {
      name = row["nome"] || row["Nome"];
    }

    if (
      has(row, "numero") ||
      has(row, "número") ||
      has(row, "Numero") ||
      has(row, "Número")
    ) {
      number = row["numero"] || row["número"] || row["Numero"] || row["Número"];
      number = `${number}`.replace(/\D/g, "");
    }

    if (
      has(row, "email") ||
      has(row, "e-mail") ||
      has(row, "Email") ||
      has(row, "E-mail")
    ) {
      email = row["email"] || row["e-mail"] || row["Email"] || row["E-mail"];
    }

    return { name, number, email, contactListId, companyId };
  });

  const contactList: ContactListItem[] = [];

  for (const contact of contacts) {
    const [newContact, created] = await ContactListItem.findOrCreate({
      where: {
        number: `${contact.number}`,
        contactListId: contact.contactListId,
        companyId: contact.companyId
      },
      defaults: contact
    });
    if (created) {
      contactList.push(newContact);
    }
  }

  if (contactList) {
    for (let newContact of contactList) {
      try {
        const response = await CheckContactNumber(newContact.number, companyId);
        if (response) {
          newContact.isWhatsappValid = true;
          newContact.number = response;
        } else {
          // Se não retornou nada, deixamos como null para tentar validar no momento do disparo
          newContact.isWhatsappValid = null;
        }
        await newContact.save();
      } catch (e) {
        logger.error(`Erro ao validar número ${newContact.number}: ${e.message}`);
        // Mantém como null em caso de erro para não excluir da campanha
        newContact.isWhatsappValid = null;
        await newContact.save();
      }
    }
  }

  return contactList;
}
