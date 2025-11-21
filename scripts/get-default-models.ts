import { getAvailableCodingModels } from "../src/lib/models/config";

const models = getAvailableCodingModels().map((m) => m.id);
console.log(JSON.stringify(models));
