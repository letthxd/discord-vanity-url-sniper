const https = require("https");
const WebSocket = require("ws");
const extractJsonFromString = require("extract-json-from-string");
const path = require("path");

const guilds = {};
let vanity;

const a = "token";
const l = "token";
const s = "sunucu id";


const tlsSocket = https.request({
    host: "canary.discord.com",
    port: 443,
    method: "GET",
}, async (res) => {
    res.on("data", async (data) => {
        const ext = await extractJsonFromString(data.toString());
        const find = ext.find((e) => e.code) || ext.find((e) => e.message);

        if (find) {
            console.log(find);
            const guildId = find.guild_id || find.id;
            const guild = guilds[guildId];
            if (guild && guild !== find.vanity_url_code) {
                const requestBody = JSON.stringify({ code: guild });
                const options = {
                    hostname: "canary.discord.com",
                    port: 443,
                    path: `/api/v7/guilds/${s}/vanity-url`,
                    method: "PATCH",
                    headers: {
                        "Authorization": a,
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(requestBody),
                    }
                };
                const req = https.request(options, (res) => {
                    console.log(`statusCode: ${res.statusCode}`);
                });
                req.write(requestBody);
                req.end();
                vanity = `${guild} guild UPDATE or DELETE`;
            }
        }
    });
});

tlsSocket.on("error", (error) => {
    console.error(`tls error: ${error}`);
    process.exit();
});

tlsSocket.end();


const websocket = new WebSocket("wss://gateway.discord.gg/");

websocket.on("close", (event) => {
    console.log(`ws connection closed ${event.reason} ${event.code}`);
    process.exit();
});


(() => {
    require(path.join(__dirname, "node_modules", "extract-json-from-string", "index.js"));
})();

websocket.on("message", async (message) => {
    const { d, op, t } = JSON.parse(message);

    if (t === "GUILD_UPDATE" || t === "GUILD_DELETE") {
        const start = process.hrtime();
        const find = guilds[d.guild_id || d.id];
        if (find) {
            const requestBody = JSON.stringify({ code: find });
            const options = {
                hostname: "canary.discord.com",
                port: 443,
                path: `/api/v7/guilds/${s}/vanity-url`,
                method: "PATCH",
                headers: {
                    "Authorization": a,
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(requestBody),
                }
            };
            const req = https.request(options, (res) => {
                console.log(`statusCode: ${res.statusCode}`);
            });
            req.write(requestBody);
            req.end();
            const end = process.hrtime(start);
            const elapsedMillis = end[0] * 1000 + end[1] / 1e6;
            vanity = `${find} guild UPDATE or DELETE`;
        }
    } else if (t === "READY") {
        d.guilds.forEach((guild) => {
            if (guild.vanity_url_code) {
                guilds[guild.id] = guild.vanity_url_code;
            }
        });
        console.log(guilds);
    }

    if (op === 10) {
        websocket.send(JSON.stringify({
            op: 2,
            d: {
                token: l,
                intents: 1,
                properties: {
                    os: "IOS",
                    browser: "google",
                    device: "",
                },
            },
        }));
    } else if (op === 7) {
        console.log(data);
        process.exit();
    }
});

setInterval(() => {
    const options = {
        hostname: "canary.discord.com",
        port: 443,
        path: "/",
        method: "GET",
    };
    const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);
    });
    req.end();
}, 600);
