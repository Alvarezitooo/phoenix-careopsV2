"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aideRouter = void 0;
const express_1 = __importDefault(require("express"));
const aideSchema_1 = require("../validators/aideSchema");
const aidesService_1 = require("../services/aidesService");
exports.aideRouter = express_1.default.Router();
exports.aideRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = aideSchema_1.aideQuerySchema.safeParse(req.query);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    try {
        const aides = yield (0, aidesService_1.getAides)(parsed.data);
        res.json({ aides });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
