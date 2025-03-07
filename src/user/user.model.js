import { Schema,model } from "mongoose";

const UserSchema = Schema({
    username:{
        type:String,
        required:[true,'Escribe tu nombre por favor']
    },
    email:{
        type:String,
        required:[true,'Escribe tu email porfavor'],
        unique:true
    },
    password:{
        type:String,
        required:[true,'Escribe tu contraseña porfavor']
    },
    compras:[],
    preferencias: [{
        type: Schema.Types.ObjectId,
        ref: 'Category' 
    }],
    role:{
        type:String,
        enum:['ADMIN_ROLE','CLIENT_ROLE'],
        default:'user'
    },
    estado:{
        type:Boolean,
        default:true
    }
})

UserSchema.methods.toJSON = function() {
    const {__v,password,_id,...user} = this.toObject()
    user.uid = _id
    return user
}

export default model('User',UserSchema)