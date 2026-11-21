# RED-Pixel-R1

Ultra-detailed smartphone camera 3D CAD workspace (Pure White Studio / Strictly Zero-Text CAD UI with deep technical explanations).

## Phase 1 — Stacked 1-Inch CMOS Image Sensor & Surroundings (Merged to `main`)
- **Macro Assembly (30 independent dissectable parts, 1 unit = 1 mm)**:
  - Optical Front-End: SUS304 EMI Shield Bezel, 54-layer TiO₂/SiO₂ Dielectric IRCF Coating, Cu²⁺ Blue Glass IRCF, 4-Step Stray-Light Baffle LCP Holder, Active-Alignment UV Gasket
  - Stacked CIS Die & Packaging: Quad-Bayer OCL/CFA + Optical Black Surface, BSI Thinned Photodiode Wafer, 2nd-Layer Pixel Transistor Substrate (2-Layer Transistor Pixel), Cu-Cu Hybrid Bonding Interface (SiCN + 432 3D Cu Micro-Pads), Stacked DRAM Frame Buffer, 22nm Bottom Logic Die (Column-Parallel ADC / AI Remosaic / MIPI PHY), 112 Peripheral Bond Pads, 112 Thermosonic Au Wire Bonding Loops, MOB Epoxy Encapsulation, DAF Thermal Adhesive
  - 3D Sensor-Shift OIS (IBIS): Moving Sensor Carrier, 4× S-Shaped Serpentine Flex Interconnects, 4× Planar Racetrack Voice Coils, 4× Dual-Pole NdFeB Magnets, Permalloy Magnetic Yoke, 3× WLCSP Hall-Effect Position Sensors, 4× ZrO₂ Ceramic Ball Bearings, BeCu Suspension Leaf Springs
  - Substrate, Passives & I/O: Multi-Layer Rigid PCB with 64 Copper Thermal Vias, 28× 01005/0201 Decoupling MLCCs, Closed-Loop OIS Driver ASIC, Calibration EEPROM, MIPI CSI-2 Polyimide FPC + EMI Film, 40-Pin 0.35mm Pitch BTB Mezzanine Connector, SUS304 Stiffener & Graphite Thermal Sheet
- **Micro Pixel Cross-Section (14 independent dissectable parts, 2×2 Quad-Bayer Sub-Micron Architecture)**:
  - CRA-Shifted High-P OCL Microlenses, High-T ARL Planarization, RGGB CFA, Hybrid Tungsten/Low-n Light-Shield Grid, HfO₂/Al₂O₃ Fixed-Charge Passivation, Full-DTI Oxide Walls, BSI Pinned Photodiodes, Dual Vertical Transfer Gates (D-VTG), Shared FD & LOFIC Overflow Capacitors, Vertical DCNT Vias, 2nd-Layer Large AMP/RST/SEL MOSFETs, M1–M5 Damascene Copper BEOL, Sub-Micron Cu-Cu Hybrid Bonding Interface, 22nm Bottom FinFET Logic Layer

## Phase 2 — Layer-2 Pixel Transistor Layer Nanoscale Dissection (26 Independent Parts, 1 unit = 100 nm)
Based on 2021–2025 IEEE IEDM / IISW state-of-the-art 3D Sequential 2-Layer Transistor Pixel research:
- **Layer 1/2 Interface & 3D Sequential Integration (6 parts)**: Buried Sublocal Sidewall Connection (BSC), Low-Temperature Fusion-Bonded SiO₂ BOX, Intermediate Poly-Si Wiring, Vertical FD Deep Contact + Coaxial Miller-Effect Shield, 4× Through-Oxide TG Deep Contacts, 2× Layer-1 P-Well VSS Reference Deep Vias
- **Body-less SOI Substrate & Dissected 3-Fin AMP SOI Pixel FinFET (9 parts)**: Body-less Ultra-Thin SOI Si Active Islands, Full-Depth STI Oxide Trenches, 3-Fin Parallel SOI Channel with Atomically Flat Terrace, Conformal Ω-Shell Thermal SiO₂/SiON Gate Dielectric, TiN Work-Function + Poly-Si/W 3D Tri-Gate Stack, Dual SiO₂/SiN Sidewall Spacers, LDD Extensions & Raised Epitaxial N+ S/D Crystals, NiPtSi Salicide Caps, +1.2 GPa Tensile-Stressed SiNx CESL
- **Pixel Control SOI FinFETs (4 parts)**: Ultra-Low-Leakage RST FinFET, Low-Ron SEL FinFET, FDG/DCG Conversion Gain Switch, 2-Stage LOFIC Overflow Partitioning Gate
- **2-Stage LOFIC 120 dB HDR Capacitor System (2 parts)**: Stage-1 High-Density Trench MOS Capacitor (~15 fF), Stage-2 3D Cylindrical High-k ZAZ (ZrO₂/Al₂O₃/ZrO₂) MIM Capacitor (~80 fF)
- **Nano Contacts & Local Interconnects (5 parts)**: 23× Ti/TiN-Lined CVD Tungsten Contact Plugs, M0 Ultra-Low-C FD Route & Active Miller Guard Traces, M1 Horizontal Row-Control Damascene Copper Bus, M2 Shielded VSL + VDD/VSS Power Rails, Porous Low-k SiCOH ILD (Cutaway) & Top Cu-Cu Exit Vias

## Development
```bash
npm install
npm run dev
npm run build
```
