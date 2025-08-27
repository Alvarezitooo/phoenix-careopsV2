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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAides = void 0;
const supabase_1 = require("../config/supabase");
const privacy_1 = require("../utils/privacy");
const getAides = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabase_1.supabase
        .from('aides')
        .select('*')
        .ilike('region', `%${query.codePostal.slice(0, 2)}%`)
        .ilike('typeHandicap', `%${query.typeHandicap}%`);
    if (error)
        throw new Error(error.message);
    return (data === null || data === void 0 ? void 0 : data.map(privacy_1.anonymiserAide)) || [];
});
exports.getAides = getAides;
