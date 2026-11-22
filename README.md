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

## Phase 3 — Optical 1G7P Lens Group, 6-Blade Variable Aperture & Closed-Loop VCM/OIS Layer (30 Independent Parts, 1 unit = 1 mm)
Dedicated standalone optical + mechatronic layer sitting above the 1-inch sensor module (100 total independent dissectable parts across all 4 modes):
- **Housing, Barrel & Stray-Light Traps (5 parts)**: Cutaway SUS430/Permalloy EMI Magnetic Shield Can, Sapphire Front Protection Window + AR/AF Coating & IP68 O-Ring, Stepped LCP Precision Lens Barrel with Inner Serrated Baffles & M10 Threads, 6× Matte-Black Inter-Lens Shading Sheets & Spacers, Rear Lock Retainer Ring & 6-Axis Active Alignment (AA) UV Flange
- **1G7P 1-Inch Aspheric Optical Prescription (9 parts)**: ALD Atomic Layer Deposition Ultra-Low-Reflectance Coating (`R < 0.15%`), L1 Molded Aspheric Lanthanum Glass (`1G/WLG`, low `dn/dT`), L2 Iupizeta EP-8000 Flint Meniscus (`n_d = 1.661, ν_d = 20.4`), L3 APEL COC Positive Crown (`n_d = 1.544, ν_d = 56.0`), L4 OKP-1 Fluorene Negative Corrector (`n_d = 1.642, ν_d = 22.3`), L5 APEL Positive Meniscus Relay, L6 Iupizeta EP-9000 High-n (`n_d = 1.671, ν_d = 19.2`), L7 Iconic Gullwing M-Shaped 16th-Order Aspheric Lens, L8 Wide W-Shaped Field Flattener & CRA ≤ 34° Control Element
- **6-Blade Stepless Variable Aperture (4 parts)**: Fixed Pivot Stator Ring (6 pins), 6 Interlocking Matte-Black 30 μm Iris Blades (`f/1.63 – f/4.0` live articulated), Slotted Cam-Drive Rotor Ring, Dedicated Side Micro-VCM Rotary Iris Actuator & Closed-Loop Hall Sensor
- **Closed-Loop Ball-Guide AF VCM Actuator (6 parts)**: Cutaway V-Groove AF Lens Carrier/Bobbin, 4-Side Self-Bonding Copper AF Voice Coils, 6× Y-TZP ZrO₂ Ceramic V-Groove Guide Balls, 2× Permalloy Magnetic Attraction Preload Yokes, 4× Multi-Pole N52 NdFeB Shared Magnets, Closed-Loop AF Z-Axis Hall/TMR Position Sensor IC
- **Lens-Shift OIS, Suspension & Electronics (6 parts)**: Cutaway OIS Fixed Housing Base with Drop-Shock Stoppers, 4× Bottom Fine Pattern OIS Coils (FP-Coil, CIPA 4.5-stop), 4× Cu-Ni-Si Alloy Suspension Wires (parallel-link + power feed), Upper & Lower Etched BeCu Flexure Leaf Springs + UV Silicone Damper Gel, 2× OIS X/Y Hall Sensors & Single-Chip Closed-Loop PID Driver IC + MLCCs, Actuator Control Polyimide FPC & ENIG Interface Pads

## Phase 4 — Topmost Exterior Camera Deco, Cover Glass DX+, IP68 Sealing & Auxiliary Sensors (24 Independent Parts, 1 unit = 1 mm)
The outermost physical layer sitting directly above the 1G7P Lens & VCM module (124 total independent dissectable parts across all 5 multiscale modes) with beginner-friendly Japanese explanations:
- **Exterior Titanium Deco & IP68 Sealing (6 parts)**: Frosted AG Rear Back Glass (Cutaway), CNC Grade-5 Titanium (`Ti-6Al-4V`) Camera Island Plateau, PVD Black-Chrome 72-Tooth Knurled Bezel Ring (+0.35 mm bumper & filter groove), IP68 Silicone O-Rings & Waterproof Acrylic Seals, 0.2 μm Pore ePTFE Breathable Barometric Vent Membrane, High-Density PORON Light-Seal Foam & Isolation Barriers
- **Multi-Layer Cover Glass Stack (4 parts)**: Fluoropolymer Oleophobic Anti-Fingerprint Coat (with micro-beading droplets), Broadband AR Interference Film, Corning Gorilla® Glass DX+ Optical Cover Slab (98% transmittance), Rear Silk-Screen Matte-Black Masking (`OD > 5.0`)
- **dToF LiDAR Laser AF Module (4 parts)**: 940 nm Near-IR Pass Black Window (Cutaway), 940 nm Class-1 VCSEL Laser Chip, Golden Nano-Grating DOE Dot Projector (up to 1,536 zones), BSI SPAD Single-Photon Avalanche Diode Array (`~10–30 ps` TDC timing)
- **Adaptive 9-LED True Tone Matrix Flash (4 parts)**: Sculpted 7-Ring Concentric Micro-Fresnel Diffuser Lens, 3×3 9-Element Warm/Cool Adaptive LED Matrix (live Wide ↔ Telephoto pattern switching), High-Reflectance Conical Reflector Cup & AlN Ceramic Submount, Constant-Current Boost Driver IC
- **Multispectral Color/Flicker, Zoom MEMS Mic & Thermal/FPC (6 parts)**: Wide-Angle Opal Ambient Diffuser Window, 11–14ch Multispectral Color & Flicker Detector IC (rainbow spectral bands), Acoustic Slit & Dual SUS/ePTFE Waterproof Mesh, High-SNR Rear Directional Zoom MEMS Microphone (`SNR 70 dB / AOP 135 dB SPL`), High-Conductivity Artificial Graphite Thermal Spreader & Copper Foil, Unified Polyimide Auxiliary Sensor FPC & BTB Connector

## Phase 5 — Periscope Telephoto Prism Mechanism, D-Cut FCD100 APO & 200MP Vertical Sensor (28 Independent Parts, 1 unit = 1 mm)
Ultra-deep dissection of a flagship folded periscope telephoto module (**152 total independent dissectable 3D CAD parts across all 6 modes**) with both primary-source optical/mechatronic specs and beginner-friendly Japanese explanations:
- **Housing, Entrance Window & Stray-Light Traps (4 parts)**: Non-Magnetic SUS304 Cutaway EMI Shield Can, Rectangular AR Entrance Window & Glare-Stop Mask, Matte-Black LCP Optical Tunnel Housing with 14 Sawtooth Knife-Edge Baffle Ribs, High-Rigidity SUS Baseplate & Artificial Graphite Thermal Sheet
- **High-Index 45° TIR Prism & 2-Axis Prism-Tilt OIS (8 parts)**: High-Index Optical Glass 45° Right-Angle TIR Prism (`H-ZF52 / L-LAH58`, `n_d = 1.85`), 45° Protected Silver (`Ag`) + Dielectric Mirror Coating (`R > 99.2%`), Entrance/Exit Broadband AR Coats & Blackened Non-Optical Sides, Moving Prism Cradle Holder (live Pitch/Yaw tilt), 2-Axis Universal Gimbal Frame & 3× `ZrO₂` Ceramic Fulcrum Pivot Balls, Dual-Pole N52H Magnets & Zero-Backlash Magnetic Preload Pulling Plate, Orthogonal Pitch/Yaw Tilt OIS Voice Coils + FPC, 2-Axis Closed-Loop Hall/TMR Angle Sensors (`0.001°` resolution)
- **D-Cut APO Telephoto & Floating Tele-Macro Lenses (7 parts)**: Fixed Front Large-Aperture D-Cut Glass Aspheric `G1`, **HOYA FCD100 Fluorite-Grade Ultra-Low-Dispersion ED D-Cut Glass `G2` (`n_d = 1.437, ν_d = 95.10`)**, High-Index Flint APO Chromatic-Corrector D-Cut Concave `G3`, Floating Tele-Macro Aspheric D-Cut `G4` (`10 cm` macro), Rear Gullwing D-Cut Field Flattener `G5`, 4× Ultra-Thin Matte-Black D-Cut Inter-Lens Shading Baffles, Cutaway Floating Linear D-Cut Lens Barrel Carriage
- **Long-Stroke Linear Ball-Guide VCM Actuator (5 parts)**: Twin Hardened Martensitic Stainless (`SUS440C`) V-Groove + Kinematic Flat Linear Guide Rails, 6× `Y-TZP ZrO₂` Ceramic Rolling Guide Balls (kinematically animated at `0.5×` carriage velocity), Long-Stroke Flat Linear AF Voice Coil, Multi-Pole N52H Linear Magnet Array, Magnetic Preload Side Yoke & Long-Stroke Linear TMR Magnetic Encoder Strip (`0.3 μm` resolution)
- **90° Vertical 1/1.4" 200MP CMOS Sensor & L-Rigid-Flex (4 parts)**: Vertical `Cu²⁺` Blue-Glass IRCF + 50-Layer IR Coating, 90° Upright 1/1.4" 200MP Stacked BSI CMOS Sensor (`ISOCELL HP9`-class, `9.1 × 6.8 mm` active area, `0.56 μm` pitch) + 28 Gold Wire-Bond Loops, Vertical CNC Oxygen-Free Copper Heatsink Backplate & TIM Pad, 90° L-Bent Rigid-Flex PCB + Dual Closed-Loop OIS/AF Driver ASIC + EEPROM + `01005` MLCCs + MIPI CSI-2 BTB Connector

## Live Demo
- GitHub Pages: https://sc8z35a-collab.github.io/RED-Pixel-R1/

## Development
```bash
npm install
npm run dev
npm run build
```
