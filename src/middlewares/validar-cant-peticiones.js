import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 15*60*1000,
    max: 100,
    message:{
        succes: false,
        msg: "Demasiadas Peticiones Desde Esta IP, Intente Mas Tarde"
    }
})

export default limiter;