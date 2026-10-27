// Unit Converter Engine for Storage, Speed, Length, Weight, Temp, Time
class UnitConverter {
  constructor() {
    this.definitions = {
      // 1. DATA STORAGE (Base: Byte)
      storage: {
        name: "Dung lượng Dữ liệu",
        baseUnit: "B",
        units: {
          b: { name: "Bit (b)", factor: 0.125 },
          B: { name: "Byte (B)", factor: 1 },
          KB: { name: "Kilobyte (KB - 10³ B)", factor: 1000 },
          MB: { name: "Megabyte (MB - 10⁶ B)", factor: 1000000 },
          GB: { name: "Gigabyte (GB - 10⁹ B)", factor: 1000000000 },
          TB: { name: "Terabyte (TB - 10¹² B)", factor: 1000000000000 },
          PB: { name: "Petabyte (PB - 10¹⁵ B)", factor: 1000000000000000 },
          KiB: { name: "Kibibyte (KiB - 1024 B)", factor: 1024 },
          MiB: { name: "Mebibyte (MiB - 1024² B)", factor: 1048576 },
          GiB: { name: "Gibibyte (GiB - 1024³ B)", factor: 1073741824 },
          TiB: { name: "Tebibyte (TiB - 1024⁴ B)", factor: 1099511627776 },
          PiB: { name: "Pebibyte (PiB - 1024⁵ B)", factor: 1125899906842624 },
        },
      },

      // 2. DATA TRANSFER SPEED (Base: bps)
      speed: {
        name: "Tốc độ Truyền / Băng thông",
        baseUnit: "bps",
        units: {
          bps: { name: "bit/s (bps)", factor: 1 },
          Kbps: { name: "Kilobit/s (Kbps)", factor: 1000 },
          Mbps: { name: "Megabit/s (Mbps)", factor: 1000000 },
          Gbps: { name: "Gigabit/s (Gbps)", factor: 1000000000 },
          Tbps: { name: "Terabit/s (Tbps)", factor: 1000000000000 },
          Bps: { name: "Byte/s (B/s)", factor: 8 },
          KBps: { name: "KiloByte/s (KB/s)", factor: 8000 },
          MBps: { name: "MegaByte/s (MB/s)", factor: 8000000 },
          GBps: { name: "GigaByte/s (GB/s)", factor: 8000000000 },
        },
      },

      // 3. LENGTH (Base: Meter)
      length: {
        name: "Độ dài",
        baseUnit: "m",
        units: {
          mm: { name: "Milimét (mm)", factor: 0.001 },
          cm: { name: "Xentimét (cm)", factor: 0.01 },
          m: { name: "Mét (m)", factor: 1 },
          km: { name: "Kilômét (km)", factor: 1000 },
          in: { name: "Inch (in)", factor: 0.0254 },
          ft: { name: "Foot / Feet (ft)", factor: 0.3048 },
          yd: { name: "Yard (yd)", factor: 0.9144 },
          mi: { name: "Dặm (Mile)", factor: 1609.344 },
        },
      },

      // 4. WEIGHT (Base: Kilogram)
      weight: {
        name: "Khối lượng",
        baseUnit: "kg",
        units: {
          mg: { name: "Miligam (mg)", factor: 0.000001 },
          g: { name: "Gam (g)", factor: 0.001 },
          kg: { name: "Kilôgam (kg)", factor: 1 },
          ta: { name: "Tạ (100 kg)", factor: 100 },
          tan: { name: "Tấn (1.000 kg)", factor: 1000 },
          oz: { name: "Ounce (oz)", factor: 0.028349523125 },
          lb: { name: "Pound (lb)", factor: 0.45359237 },
        },
      },

      // 5. TEMPERATURE (Special conversions)
      temperature: {
        name: "Nhiệt độ",
        units: {
          C: { name: "Độ C (Celsius - °C)" },
          F: { name: "Độ F (Fahrenheit - °F)" },
          K: { name: "Độ K (Kelvin)" },
        },
      },

      // 6. TIME (Base: Second)
      time: {
        name: "Thời gian",
        baseUnit: "s",
        units: {
          ms: { name: "Mili-giây (ms)", factor: 0.001 },
          s: { name: "Giây (s)", factor: 1 },
          min: { name: "Phút (min)", factor: 60 },
          h: { name: "Giờ (h)", factor: 3600 },
          d: { name: "Ngày (day)", factor: 86400 },
          w: { name: "Tuần (week)", factor: 604800 },
          m: { name: "Tháng (30 ngày)", factor: 2592000 },
          y: { name: "Năm (365 ngày)", factor: 31536000 },
        },
      },
    };
  }

  // Convert temperature
  convertTemp(val, fromUnit, toUnit) {
    if (isNaN(val)) return 0;
    // Step 1: to Celsius
    let c = 0;
    if (fromUnit === "C") c = val;
    else if (fromUnit === "F") c = (val - 32) * (5 / 9);
    else if (fromUnit === "K") c = val - 273.15;

    // Step 2: Celsius to target
    if (toUnit === "C") return c;
    if (toUnit === "F") return c * (9 / 5) + 32;
    if (toUnit === "K") return c + 273.15;
    return c;
  }

  // Standard conversion
  convert(category, val, fromUnit, toUnit) {
    if (isNaN(val)) return 0;
    if (category === "temperature") {
      return this.convertTemp(val, fromUnit, toUnit);
    }

    const cat = this.definitions[category];
    if (!cat || !cat.units[fromUnit] || !cat.units[toUnit]) return 0;

    const fromFactor = cat.units[fromUnit].factor;
    const toFactor = cat.units[toUnit].factor;

    // Value in base unit
    const inBase = val * fromFactor;
    // Convert to target unit
    const result = inBase / toFactor;
    return result;
  }

  // Calculate file download time estimate
  calculateDownloadTime(fileSize, sizeUnit, netSpeed, speedUnit) {
    if (
      !Number.isFinite(fileSize) ||
      !Number.isFinite(netSpeed) ||
      fileSize < 0 ||
      netSpeed <= 0 ||
      !this.definitions.storage.units[sizeUnit] ||
      !this.definitions.speed.units[speedUnit]
    )
      return null;

    // Size in bits
    const sizeBytes =
      fileSize * (this.definitions.storage.units[sizeUnit]?.factor || 1);
    const sizeBits = sizeBytes * 8;

    // Speed in bps
    const speedBps =
      netSpeed * (this.definitions.speed.units[speedUnit]?.factor || 1);

    const seconds = sizeBits / speedBps;

    const rounded = Math.round(seconds);
    const h = Math.floor(rounded / 3600);
    const m = Math.floor((rounded % 3600) / 60);
    const s = rounded % 60;

    const parts = [];
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0 || h > 0) parts.push(`${m} phút`);
    parts.push(`${s} giây`);

    return {
      totalSeconds: seconds,
      formattedTime: parts.join(" "),
    };
  }
}

window.unitConverter = new UnitConverter();
