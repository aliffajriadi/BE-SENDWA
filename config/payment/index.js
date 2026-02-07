import { Pakasir } from "pakasir-sdk";

const pakasir = new Pakasir({
    slug: process.env.PAKASIR_SLUG,
    apikey: process.env.PAKASIR_API_KEY,
});

export default pakasir;