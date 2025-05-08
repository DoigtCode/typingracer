import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export async function gpt_request(_messages) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.AI_TOKEN
        });
        
        const chatCompletion = await openai.chat.completions.create({
            messages: _messages,
            model: 'gpt-4o-mini',
            temperature : 1.1
        });

        console.log(chatCompletion.choices[0].message.content)
    
        return (chatCompletion.choices[0].message.content);
    } catch (err) {
        console.log("Requête GPT : " + err);
    }
}

export async function game_generate_text(nbWords, theme)
{
    var prompt = [{
        role: "system",
        content: `Génère une phrase complète et grammaticalement correcte de ${nbWords} mots exactement, sur le thème "${theme}".
            Le ton peut être neutre, légèrement absurde ou bavard.
            La phrase n’a pas besoin d’être particulièrement intéressante, mais elle doit rester fluide, naturelle à lire et vaguement liée au thème.
            N’utilise pas de listes ou de points-virgules.
            Le but est de fournir une phrase que des joueurs devront taper entièrement au clavier, donc elle doit être variée, cohérente et non répétitive.
            Rédige directement la phrase sans contexte préalable.`
    }]

    const res = await gpt_request(prompt);
    return res;
}

export function game_generate_roomID(length = 4) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}