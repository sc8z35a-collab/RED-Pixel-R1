# RED-Pixel-R1

Ultra-detailed smartphone camera 3D CAD workspace (White Studio / Zero-Text CAD UI with deep technical explanations).

## Phase 1 — Stacked 1-Inch CMOS Image Sensor & Surroundings
- **Macro Assembly (30 independent dissectable parts, 1 unit = 1 mm)**:
  - Optical Front-End: SUS304 EMI Shield Bezel, 54-layer TiO₂/SiO₂ Dielectric IRCF Coating, Cu²⁺ Blue Glass IRCF, 4-Step Stray-Light Baffle LCP Holder, Active-Alignment UV Gasket
  - Stacked CIS Die & Packaging: Quad-Bayer OCL/CFA + Optical Black Surface, BSI Thinned Photodiode Wafer, 2nd-Layer Pixel Transistor Substrate (2-Layer Transistor Pixel), Cu-Cu Hybrid Bonding Interface (SiCN + 3D Cu Micro-Pads), Stacked DRAM Frame Buffer, 22nm Bottom Logic Die (Column-Parallel ADC / AI Remosaic / MIPI PHY), 112 Peripheral Bond Pads, 112 Thermosonic Au Wire Bonding Loops, MOB Epoxy Encapsulation, DAF Thermal Adhesive
  - 3D Sensor-Shift OIS (IBIS): Moving Sensor Carrier, 4× S-Shaped Serpentine Flex Interconnects, 4× Planar Racetrack Voice Coils, 4× Dual-Pole NdFeB Magnets, Permalloy Magnetic Yoke, 3× WLCSP Hall-Effect Position Sensors, 4× ZrO₂ Ceramic Ball Bearings, BeCu Suspension Leaf Springs
  - Substrate, Passives & I/O: Multi-Layer Rigid PCB with 64 Copper Thermal Vias, 28× 01005/0201 Decoupling MLCCs, Closed-Loop OIS Driver ASIC, Calibration EEPROM, MIPI CSI-2 Polyimide FPC + EMI Film, 40-Pin 0.35mm Pitch BTB Mezzanine Connector, SUS304 Stiffener & Graphite Thermal Sheet
- **Micro Pixel Cross-Section (14 independent dissectable parts, 2×2 Quad-Bayer Sub-Micron Architecture)**:
  - CRA-Shifted High-P OCL Microlenses, High-T ARL Planarization, RGGB CFA, Hybrid Tungsten/Low-n Light-Shield Grid, HfO₂/Al₂O₃ Fixed-Charge Passivation, Full-DTI Oxide Walls, BSI Pinned Photodiodes, Dual Vertical Transfer Gates (D-VTG), Shared FD & LOFIC Overflow Capacitors, Vertical DCNT Vias, 2nd-Layer Large AMP/RST/SEL MOSFETs, M1–M5 Damascene Copper BEOL, Sub-Micron Cu-Cu Hybrid Bonding Interface, 22nm Bottom FinFET Logic Layer

## Development
```bash
npm install
npm run dev
npm run build
```
