export default function Icon({ name, className = '', ...props }) {
  return <svg className={'icon ' + className} aria-hidden="true" {...props}><use href={'#i-' + name} /></svg>;
}

export function IconDefinitions() { return (<svg xmlns="http://www.w3.org/2000/svg" style={{"position":"absolute","width":"0","height":"0","overflow":"hidden"}} aria-hidden="true"><defs>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
<symbol id="i-up-right" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6h12v12"/></symbol>
<symbol id="i-down" viewBox="0 0 24 24"><path d="M12 4v16m-6-6 6 6 6-6"/></symbol>
<symbol id="i-chevron" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></symbol>
<symbol id="i-code" viewBox="0 0 24 24"><path d="m7 6-5 6 5 6M17 6l5 6-5 6M14 3l-4 18"/></symbol>
<symbol id="i-github" viewBox="0 0 24 24"><path d="M9 19c-4 1-4-2-6-2m12 5v-4c0-1 .2-2-.5-2.5 4-.5 6-2.1 6-6a4.8 4.8 0 0 0-1.3-3.3A5 5 0 0 0 19 2s-1.3-.4-4 1.5a13.4 13.4 0 0 0-6 0C6.3 1.6 5 2 5 2a5 5 0 0 0-.2 4.2A4.8 4.8 0 0 0 3.5 9.5c0 3.9 2 5.5 6 6C8.8 16 9 17 9 18v4"/></symbol>
<symbol id="i-linkedin" viewBox="0 0 24 24"><path d="M4 9h4v12H4zM6 3v.1M12 21V9h4v2c.7-2.8 6-3.3 6 2v8h-4v-7c0-2-2-2-2 0v7"/><circle cx="6" cy="4" r="1.5"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></symbol>
<symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7V4h6l3 3h9v13H3Zm0 0h9"/></symbol>
<symbol id="i-school" viewBox="0 0 24 24"><path d="m2 8 10-5 10 5-10 5-10-5Zm4 2v7c4 3 8 3 12 0v-7m4-2v8"/></symbol>
<symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0M12 12v4"/></symbol>
<symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="m8 12-2 10 6-3 6 3-2-10"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M12 5c-3-2-6-2-10-1v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v16"/></symbol>
<symbol id="i-file" viewBox="0 0 24 24"><path d="M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8M8 16h8"/></symbol>
<symbol id="i-settings" viewBox="0 0 24 24"><path d="m10 2-1 3-3 1-3-1-2 4 2 3-1 3 2 4 3-1 3 1 1 3h4l1-3 3-1 2-4-2-3 1-3-2-3-3 1-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/></symbol>
<symbol id="i-upload" viewBox="0 0 24 24"><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="i-edit" viewBox="0 0 24 24"><path d="m4 15 12-12 5 5L9 20l-6 1 1-6ZM14 5l5 5"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12c5-9 15-9 20 0-5 9-15 9-20 0Z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m4 12 5 5L20 6"/></symbol>
<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></symbol>
<symbol id="i-database" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/></symbol>
<symbol id="i-layers" viewBox="0 0 24 24"><path d="m2 7 10-5 10 5-10 5L2 7Zm0 5 10 5 10-5M2 17l10 5 10-5"/></symbol>
<symbol id="i-terminal" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="m6 8 4 4-4 4m7 0h5"/></symbol>
<symbol id="i-box" viewBox="0 0 24 24"><path d="m3 6 9-4 9 4v12l-9 4-9-4V6Zm0 0 9 5 9-5m-9 5v11M7 4l10 5"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><rect x="6" y="1" width="12" height="22" rx="3"/><path d="M10 4h4m-3 16h2"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="m12 2 9 4v6c0 6-9 10-9 10s-9-4-9-10V6l9-4Z"/><path d="m8 12 3 3 5-6"/></symbol>
<symbol id="i-tool" viewBox="0 0 24 24"><path d="M14 3a6 6 0 0 0-7 8L2 17a3 3 0 0 0 5 5l6-7a6 6 0 0 0 8-8l-4 4-4-4 4-4Z"/></symbol>
<symbol id="i-bike" viewBox="0 0 24 24"><circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 5-9 5 9H5m0-12h5m5 0h3l2 5M10 8h7"/></symbol>
<symbol id="i-laptop" viewBox="0 0 24 24"><path d="M4 16V4h16v12M2 16h20l-2 4H4l-2-4Z"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="m2 10 10-8 10 8M5 8v13h14V8M9 21v-7h6v7"/></symbol>
<symbol id="i-rocket" viewBox="0 0 24 24"><path d="M8 16c0-7 4-12 13-13 0 9-6 13-13 13Zm0-4-5 1-1 5 6-2m4 0-1 6 5-1 1-5M5 19l-3 3m4-2-2 2"/><circle cx="16" cy="8" r="2"/></symbol>
<symbol id="i-bolt" viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/></symbol>
<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/></symbol>
<symbol id="i-drag" viewBox="0 0 24 24"><path d="M9 4v.1M15 4v.1M9 12v.1M15 12v.1M9 20v.1M15 20v.1" strokeWidth="3"/></symbol>
</defs></svg>
); }
