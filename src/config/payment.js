import { Pakasir } from "pakasir-sdk";

const pakasir = new Pakasir({
    slug: process.env.PAKASIR_SLUG || "dummy_slug",
    apikey: process.env.PAKASIR_API_KEY || "dummy_api_key",
});

export default pakasir;