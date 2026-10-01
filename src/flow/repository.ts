import { FlowConfig } from "./type.js";

const configs: FlowConfig[] = [
  {
    id: "id-123",
    trigger: ["halo", "hi"],
    steps: [
      {
        id: "greeting",
        response: {
          text: "Selamat Datang di Multi Purpose Bot!",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Menu Utama", callback_data: "ask_wants" }],
            ],
          },
        },
      },

      {
        id: "ask_wants",
        response: {
          text: "Sedang mencari apa?",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Info Cuaca", callback_data: "info_cuaca" },
                {
                  text: "Info Jadwal Sholat",
                  callback_data: "info_jadwal_sholat",
                },
                {
                  text: "Send Photo",
                  callback_data: "send_photo",
                },
              ],
            ],
          },
        },
      },
      {
        id: "send_photo",
        response: {
          photo:
            "https://images.unsplash.com/photo-1575936123452-b67c3203c357?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80", // dummy image
          caption: "Pesan dengan photo",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Menu Utama", callback_data: "ask_wants" }],
            ],
          },
        },
      },
      {
        id: "info_cuaca",
        response: {
          text: "Info cuaca di jakarta",
        },
      },

      {
        id: "request_location",
        context: "request_location",
        response: {
          text: "Untuk request cuaca, mohon berikan lokasi anda",
          reply_markup: {
            keyboard: [
              [
                {
                  text: "Kirim Lokasi",
                  request_location: true,
                },
              ],
            ],
          },
        },
      },

      {
        id: "info_jadwal_sholat",
        http: {
          context: "info_jadwal_sholat_api",
          config: {
            method: "GET",
            url: "https://api.myquran.com/v3/sholat/jadwal/eda80a3d5b344bc40f3bc04f65b7a357/today?tz=Asia%2FJakarta",
          },
        },

        response: {
          $expr:
            "({ text: `Jadwal Sholat Hari Ini \\n${context.info_jadwal_sholat_api.data.data.prov} \\n${Object.entries(Object.values(context.info_jadwal_sholat_api.data.data.jadwal)[0]).map(([key, value]) => `${key.toUpperCase()} : ${value}`).join('\\n')}` })",
          text: "-",
        },
      },
    ],
  },
];

class FlowRepository {
  async findByTrigger({ trigger }: { trigger: string }) {
    return configs.find((item) => item.trigger.includes(trigger.toLowerCase()));
  }

  async findById({ id }: { id: string }) {
    return configs.find((item) => item.id === id);
  }
}

export const flowRepository = new FlowRepository();
