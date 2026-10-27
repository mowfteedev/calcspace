// IP Subnet & CIDR Calculator Engine for SysAdmin & NetEng
class IPCalculator {
  constructor() {}

  // Parse IP string to 32-bit unsigned int
  ipToInt(ipStr) {
    const parts = ipStr.trim().split(".");
    if (parts.length !== 4) return null;
    let num = 0;
    for (let i = 0; i < 4; i++) {
      const octet = Number(parts[i]);
      if (
        !/^\d{1,3}$/.test(parts[i]) ||
        !Number.isInteger(octet) ||
        octet < 0 ||
        octet > 255
      )
        return null;
      num = (num << 8) | octet;
    }
    return num >>> 0;
  }

  // Convert 32-bit unsigned int to IP string
  intToIp(num) {
    return [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255,
    ].join(".");
  }

  // Convert int to 8-bit padded binary string
  toBinOctet(num) {
    return (num >>> 0).toString(2).padStart(8, "0");
  }

  intToBinString(num) {
    return [
      this.toBinOctet((num >>> 24) & 255),
      this.toBinOctet((num >>> 16) & 255),
      this.toBinOctet((num >>> 8) & 255),
      this.toBinOctet(num & 255),
    ].join(".");
  }

  // Prefix to Subnet Mask integer
  prefixToMask(prefix) {
    if (prefix === 0) return 0;
    return (0xffffffff << (32 - prefix)) >>> 0;
  }

  // Subnet Mask to Prefix length
  maskToPrefix(maskInt) {
    let count = 0;
    let m = maskInt;
    while (m & 0x80000000) {
      count++;
      m = (m << 1) >>> 0;
    }
    return count;
  }

  // Classify IP type according to RFCs
  classifyIP(ipInt) {
    const b1 = (ipInt >>> 24) & 255;
    const b2 = (ipInt >>> 16) & 255;

    // RFC 1122 Loopback (127.0.0.0/8)
    if (b1 === 127)
      return {
        type: "Loopback",
        rfc: "RFC 1122",
        isPrivate: true,
        badge: "badge-purple",
      };

    // RFC 1918 Private
    if (b1 === 10)
      return {
        type: "Private IP (Class A)",
        rfc: "RFC 1918",
        isPrivate: true,
        badge: "badge-emerald",
      };
    if (b1 === 172 && b2 >= 16 && b2 <= 31)
      return {
        type: "Private IP (Class B)",
        rfc: "RFC 1918",
        isPrivate: true,
        badge: "badge-emerald",
      };
    if (b1 === 192 && b2 === 168)
      return {
        type: "Private IP (Class C)",
        rfc: "RFC 1918",
        isPrivate: true,
        badge: "badge-emerald",
      };

    // RFC 3927 APIPA / Link-Local (169.254.0.0/16)
    if (b1 === 169 && b2 === 254)
      return {
        type: "Link-Local (APIPA)",
        rfc: "RFC 3927",
        isPrivate: true,
        badge: "badge-amber",
      };

    // RFC 6598 Carrier-Grade NAT (100.64.0.0/10)
    if (b1 === 100 && b2 >= 64 && b2 <= 127)
      return {
        type: "Carrier-Grade NAT (CGNAT)",
        rfc: "RFC 6598",
        isPrivate: true,
        badge: "badge-amber",
      };

    // RFC 5737 Documentation TEST-NET
    if (b1 === 192 && b2 === 0 && ((ipInt >>> 8) & 255) === 2)
      return {
        type: "TEST-NET-1 Documentation",
        rfc: "RFC 5737",
        isPrivate: true,
        badge: "badge-blue",
      };
    if (b1 === 198 && b2 === 51 && ((ipInt >>> 8) & 255) === 100)
      return {
        type: "TEST-NET-2 Documentation",
        rfc: "RFC 5737",
        isPrivate: true,
        badge: "badge-blue",
      };
    if (b1 === 203 && b2 === 0 && ((ipInt >>> 8) & 255) === 113)
      return {
        type: "TEST-NET-3 Documentation",
        rfc: "RFC 5737",
        isPrivate: true,
        badge: "badge-blue",
      };

    // Multicast (224.0.0.0/4)
    if (b1 >= 224 && b1 <= 239)
      return {
        type: "Multicast (Class D)",
        rfc: "RFC 5771",
        isPrivate: false,
        badge: "badge-rose",
      };

    // Reserved (240.0.0.0/4)
    if (b1 >= 240)
      return {
        type: "Reserved (Class E)",
        rfc: "RFC 1112",
        isPrivate: false,
        badge: "badge-gray",
      };

    if (b1 === 0)
      return {
        type: "This network / Unspecified",
        rfc: "Special-use",
        isPrivate: false,
        badge: "badge-gray",
      };
    if (b1 === 198 && (b2 === 18 || b2 === 19))
      return {
        type: "Benchmarking",
        rfc: "Special-use",
        isPrivate: false,
        badge: "badge-amber",
      };
    if (b1 === 192 && b2 === 0 && ((ipInt >>> 8) & 255) === 0)
      return {
        type: "IETF Protocol Assignments",
        rfc: "Special-use",
        isPrivate: false,
        badge: "badge-gray",
      };
    // Public Internet Routable
    return {
      type: "Public IP (Toàn cầu)",
      rfc: "Internet Routable",
      isPrivate: false,
      badge: "badge-sky",
    };
  }

  // Main calculate method
  calculate(inputStr, customPrefix = null) {
    let ipPart = inputStr.trim();
    let prefix = customPrefix !== null ? Number(customPrefix) : 24;

    if (ipPart.includes("/")) {
      const split = ipPart.split("/");
      if (split.length !== 2 || !/^\d{1,2}$/.test(split[1].trim())) {
        return { error: "CIDR phải là số nguyên từ 0 đến 32." };
      }
      ipPart = split[0].trim();
      prefix = Number(split[1].trim());
    }

    const ipInt = this.ipToInt(ipPart);
    if (ipInt === null) {
      return {
        error:
          "Địa chỉ IP không hợp lệ! Vui lòng nhập đúng định dạng IPv4 (ví dụ 192.168.1.150).",
      };
    }

    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      return { error: "Prefix CIDR không hợp lệ! Giá trị phải từ 0 đến 32." };
    }

    const maskInt = this.prefixToMask(prefix);
    const wildcardInt = ~maskInt >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (ipInt | wildcardInt) >>> 0;

    let firstHostInt = 0;
    let lastHostInt = 0;
    let usableHosts = 0;
    let totalAddresses = Math.pow(2, 32 - prefix);

    if (prefix === 32) {
      firstHostInt = ipInt;
      lastHostInt = ipInt;
      usableHosts = 1;
    } else if (prefix === 31) {
      // RFC 3021 Point-to-Point links
      firstHostInt = networkInt;
      lastHostInt = broadcastInt;
      usableHosts = 2;
    } else if (prefix === 0) {
      firstHostInt = 1;
      lastHostInt = 0xfffffffe >>> 0;
      usableHosts = Math.pow(2, 32) - 2;
    } else {
      firstHostInt = (networkInt + 1) >>> 0;
      lastHostInt = (broadcastInt - 1) >>> 0;
      usableHosts = Math.max(0, totalAddresses - 2);
    }

    const classification = this.classifyIP(ipInt);

    return {
      ip: this.intToIp(ipInt),
      prefix,
      cidr: `${this.intToIp(ipInt)}/${prefix}`,
      network: this.intToIp(networkInt),
      networkCidr: `${this.intToIp(networkInt)}/${prefix}`,
      broadcast:
        prefix >= 31 ? "N/A (RFC 3021 / P2P)" : this.intToIp(broadcastInt),
      subnetMask: this.intToIp(maskInt),
      wildcardMask: this.intToIp(wildcardInt),
      firstHost: this.intToIp(firstHostInt),
      lastHost: this.intToIp(lastHostInt),
      hostRange:
        prefix >= 32
          ? this.intToIp(ipInt)
          : `${this.intToIp(firstHostInt)} — ${this.intToIp(lastHostInt)}`,
      usableHosts: usableHosts.toLocaleString("vi-VN"),
      totalAddresses: totalAddresses.toLocaleString("vi-VN"),
      ipBinary: this.intToBinString(ipInt),
      maskBinary: this.intToBinString(maskInt),
      wildcardBinary: this.intToBinString(wildcardInt),
      classification,
    };
  }
}

window.ipCalc = new IPCalculator();
