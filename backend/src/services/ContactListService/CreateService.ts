import * as Yup from "yup";
import AppError from "../../errors/AppError";
import ContactList from "../../models/ContactList";

interface Data {
  name: string;
  companyId: number | string;
}

const CreateService = async (data: Data): Promise<ContactList> => {
  const { name, companyId } = data;

  const ticketnoteSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "O nome da lista deve ter pelo menos 2 caracteres")
      .required("O nome da lista é obrigatório")
  });

  try {
    await ticketnoteSchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await ContactList.create(data);

  return record;
};

export default CreateService;
