import Role from '../role/role.model.js';
import Usuario from '../user/user.model.js';

export const esRoleValido = async (role = "") => {
    const existeRol = await Role.findOne({role});

    if(!existeRol){
        throw new Error(`El Rol ${role} No Existe Dentro De La Data Base`);
    }
}

export const existenteEmail = async (correo = '') => {
    const existeEmail = await Usuario.findOne({correo});

    if(existeEmail){
        throw new Error(`El Correo ${correo} Ya Existe En La Data Base`);
    }
}

export const existeUsuarioById = async (id = "") => {
    const existeUsuario = await Usuario.findById(id);
    console.log("Id")
    if(!existeUsuario){
        throw new Error(`El Id ${id} no existe`);
    }
}