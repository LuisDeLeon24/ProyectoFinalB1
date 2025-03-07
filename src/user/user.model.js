import { Schema,model } from "mongoose";

const UserSchema = Schema({
    username:{
        type:String,
        required:[true,'Necesitamos tu username brrrrro.']
    },
    email:{
        type:String,
        required:[true,'Necesitamos tu email brrrrro'],
        unique:true
    },
    password:{
        type:String,
        required:[true,'Necesitamos tu contraseña brrrrro']
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