const express = require("express");
const cors = require("cors");
require("dotenv").config();
const {createClient} = require("@supabase/supabase-js");

const app = express();
const PORT = 3000;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

app.use(cors());
app.use(express.json());

app.post("/api/verify-code", async (req, res) => {
    const {code} = req.body;

    if (!code) {
        return res.status(400).json({message: "Code is required"});
    }

    try {
        const {data, error} = await supabase
            .from("codes")
            .select("*")
            .eq("code", code)
            .maybeSingle();

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({valid: false});
        }

        if (!data) {
            return res.status(403).json({valid: false});
        }

        return res.status(200).json({valid: true});
    } catch (err) {
        console.error("Unexpected error:", err);
        return res.status(500).json({valid: false});
    }
});

app.post("/api/create-code", async (req, res) => {
    try {
        const {data, error} = await supabase
            .from("codes")
            .insert({})
            .select("code")
            .single();
        console.log("✅ Код создан:", data.code);
        if (error) {
            console.error("Ошибка создания кода:", error);
            return res.status(500).json({message: "Не удалось создать код"});
        }

        return res.status(200).json({code: data.code});
    } catch (err) {
        console.error("Неожиданная ошибка:", err);
        return res.status(500).json({message: "Ошибка сервера"});
    }
});


app.post("/api/delete-code", async (req, res) => {
    const {code} = req.body;

    if (!code) {
        return res.status(400).json({message: "Code is required"});
    }

    try {
        const {error} = await supabase
            .from("codes")
            .delete()
            .eq("code", code);

        if (error) {
            console.error("Ошибка удаления кода:", error);
            return res.status(500).json({success: false});
        }

        return res.status(200).json({success: true});
    } catch (err) {
        console.error("Unexpected error:", err);
        return res.status(500).json({success: false});
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
