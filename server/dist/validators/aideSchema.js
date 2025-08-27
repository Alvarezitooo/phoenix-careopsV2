"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aideQuerySchema = void 0;
const zod_1 = require("zod");
exports.aideQuerySchema = zod_1.z.object({
    codePostal: zod_1.z.string().length(5),
    typeHandicap: zod_1.z.string().min(2),
});
