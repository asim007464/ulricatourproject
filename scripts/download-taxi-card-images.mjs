import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public/wp-content/uploads/2026/03/taxi-cards");
const uploadsDir = path.join(root, "public/wp-content/uploads/2026/03");

const TRANSFER_IMAGES = [
  {
    file: "airport-arrivals.jpg",
    url: "https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "airport-luggage.jpg",
    url: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "private-suv.jpg",
    url: "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "highway-transfer.jpg",
    url: "https://images.pexels.com/photos/2387866/pexels-photo-2387866.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "airport-exterior.jpg",
    url: "https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "white-transfer-car.jpg",
    url: "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "traveler-airport.jpg",
    url: "https://images.pexels.com/photos/3183190/pexels-photo-3183190.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "road-transfer.jpg",
    url: "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "night-drive.jpg",
    url: "https://images.pexels.com/photos/2196924/pexels-photo-2196924.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "luxury-sedan.jpg",
    url: "https://images.pexels.com/photos/733745/pexels-photo-733745.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "airport-terminal.jpg",
    url: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    file: "transfer-van.jpg",
    url: "https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
];

const GEMINI_IMAGE = {
  file: "Gemini_Generated_Image_x073vbx073vbx073-e1773295454769.png",
  url: "https://ronicas.com/wp-content/uploads/2026/03/Gemini_Generated_Image_x073vbx073vbx073-e1773295454769.png",
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed ${url}: ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      })
      .on("error", reject);
  });
}

async function downloadImage(image, destDir, force = false) {
  const dest = path.join(destDir, image.file);
  if (!force && fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
    return;
  }
  await download(image.url, dest);
  console.log("OK", image.file);
}

export async function downloadTaxiCardImages() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  for (const image of TRANSFER_IMAGES) {
    try {
      await downloadImage(image, outDir, process.argv.includes("--force"));
    } catch (error) {
      console.warn("FAIL", image.file, error.message);
    }
  }

  try {
    await downloadImage(GEMINI_IMAGE, uploadsDir);
  } catch (error) {
    console.warn("FAIL", GEMINI_IMAGE.file, error.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await downloadTaxiCardImages();
  console.log("Done downloading transfer card images.");
}
