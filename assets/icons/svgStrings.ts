export function departureSvg() {
  return `<svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="9" fill="#0d7ff2" fill-opacity="0.25" stroke="#0d7ff2" stroke-width="2.5"/><circle cx="11" cy="11" r="4" fill="#0d7ff2"/></svg>`;
}

export function waypointSvg(n: number) {
  return `<svg width="24" height="30" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg"><path d="M12 1C6.477 1 2 5.477 2 11c0 7.5 10 18 10 18S22 18.5 22 11C22 5.477 17.523 1 12 1z" fill="#0d7ff2"/><text x="12" y="12" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="system-ui,-apple-system,Arial,sans-serif" font-size="10" font-weight="bold">${n}</text></svg>`;
}

export function destinationSvg() {
  return `<svg width="22" height="22" viewBox="0 -960 960 960" xmlns="http://www.w3.org/2000/svg"><path d="M200-120v-680h360l16 80h224v400H520l-16-80H280v280h-80Z" fill="#0d7ff2"/></svg>`;
}

export function addressSvg(fill = "#0d7ff2") {
  return `<svg width="24" height="24" viewBox="0 -960 960 960" fill="${fill}" xmlns="http://www.w3.org/2000/svg"><path d="M480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm-28 74q-14-5-25-15-65-60-115-117t-83.5-110.5q-33.5-53.5-51-103T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 45-17.5 94.5t-51 103Q698-301 648-244T533-127q-11 10-25 15t-28 5q-14 0-28-5Zm28-448Zm56.5 56.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5Z"/></svg>`;
}

export default {};
