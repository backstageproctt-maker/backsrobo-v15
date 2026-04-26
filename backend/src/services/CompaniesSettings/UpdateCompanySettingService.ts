/** 
 * @TercioSantos-0 |
 * serviço/atualizar 1 configuração da empresa |
 * @params:companyId/column(name)/data
 */
import sequelize from "../../database";
import CompaniesSettings from "../../models/CompaniesSettings";

type Params = {
  companyId: number,
  column:string,
  data:string
};

const UpdateCompanySettingsService = async ({companyId, column, data}:Params): Promise<any> => {

  const settings = await CompaniesSettings.findOne({
    where: { companyId }
  });

  if (settings) {
    await settings.update({ [column]: data });
  } else {
    // If for some reason it doesn't exist, create it
    await CompaniesSettings.create({
      companyId,
      [column]: data
    });
  }

  return { success: true };
};

export default UpdateCompanySettingsService;