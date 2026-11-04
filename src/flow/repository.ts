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
                { text: "Info Cuaca", callback_data: "request_location" },
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
        http: {
          context: "info_cuaca_api",
          config: {
            $expr:
              "({ url: `https://api.open-meteo.com/v1/forecast?latitude=${context.request_location.message.location.latitude}&longitude=${context.request_location.message.location.longitude}&hourly=weather_code&timezone=Asia%2FJakarta&forecast_days=1`})",
            method: "GET",
          },
        },
        response: {
          $expr:
            "({ text: `Prakiraan Cuaca Harian\nTanggal: ${context.info_cuaca_api.data.hourly.time[0].split('T')[0]}\nLokasi: ${context.info_cuaca_api.data.latitude}, ${context.info_cuaca_api.data.longitude}\nZona Waktu: ${context.info_cuaca_api.data.timezone}\n\nPrakiraan Cuaca Per Jam:\n${context.info_cuaca_api.data.hourly.time.map((time, index) => { const weatherCodes = { 0: 'Cerah', 1: 'Cerah sebagian', 2: 'Cerah berawan', 3: 'Berawan', 45: 'Berkabut', 48: 'Berkabut tebal', 51: 'Gerimis ringan', 53: 'Gerimis sedang', 55: 'Gerimis lebat', 56: 'Gerimis beku ringan', 57: 'Gerimis beku lebat', 61: 'Hujan ringan', 63: 'Hujan sedang', 65: 'Hujan lebat', 66: 'Hujan beku ringan', 67: 'Hujan beku lebat', 71: 'Salju ringan', 73: 'Salju sedang', 75: 'Salju lebat', 77: 'Butiran salju', 80: 'Hujan lokal ringan', 81: 'Hujan lokal sedang', 82: 'Hujan lokal lebat', 85: 'Hujan salju ringan', 86: 'Hujan salju lebat', 95: 'Badai petir', 96: 'Badai petir disertai hujan es', 99: 'Badai petir disertai hujan es lebat' }; return time.split('T')[1] + ' WIB: ' + (weatherCodes[context.info_cuaca_api.data.hourly.weather_code[index]] || 'Tidak diketahui'); }).join('\\n')}` })",
          text: "-",
        },
      },

      {
        id: "request_location",
        context: "request_location",
        response: {
          text: "Untuk request cuaca, mohon berikan lokasi anda",
          next_step: "info_cuaca",
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
