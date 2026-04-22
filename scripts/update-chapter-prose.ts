import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { Chapter, type ChapterBlock } from "../src/models/Chapter.ts";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function paragraph(text: string): ChapterBlock {
  return { type: "paragraph", text };
}

async function main() {
  const uri = requiredEnv("MONGODB_URI");
  await mongoose.connect(uri);

  const design = await Chapter.findOne({ slug: "design-methodology" }).lean();
  const control = await Chapter.findOne({ slug: "control-system" }).lean();

  if (!design) throw new Error("Missing chapter: design-methodology");
  if (!control) throw new Error("Missing chapter: control-system");

  const existingDesignEquation = (design.blocks as ChapterBlock[]).find(
    (b) => b.type === "equation"
  );

  const designHeading = (design.blocks as ChapterBlock[]).find(
    (b) => b.type === "heading" && b.level === 1
  );

  const improvedDesignParas = [
    `The design process was driven by a central constraint: achieving independent actuation of four motion primitives—bending, elongation, contraction, and twisting—within a single monolithic silicone body. This requirement ruled out conventional single-chamber Pneu-Net designs, which inherently couple bending and axial extension under uniform inflation pressure.`,
    `Model A employed a ribbed Pneu-Net chamber geometry, selected for its established bending performance in the literature. While baseline bending was confirmed, the ribbed geometry provided insufficient resistance to axial elongation, and mode coupling was observed at pressures exceeding 3 kPa. The absence of cross-sectional constraints allowed undesired ovalization of the arm body.`,
    `Model B introduced chamber uniformity improvements and passive guidance ribs along the outer wall to resist ovalization. Bending repeatability improved; however, twisting and elongation remained strongly coupled under the pressure ranges required for practical manipulation. The guidance features increased wall stiffness unevenly, introducing asymmetric deformation not present in simulation.`,
    `The final Model C adopts a Type C deep-chamber Pneu-Net architecture, selected because deeper chambers increase the pneumatic moment arm — the perpendicular distance between the pressurized face and the neutral bending axis — enabling larger angular deformation before chamber wall contact or geometric self-interference. This geometry was validated first in ANSYS FEA before committing to fabrication.`,
    `The tri-leg ring topology ("fidget-spinner" constraint ring) was introduced as a passive kinematic scaffold. Its geometric action is to resist cross-sectional ovalization and constrain inter-chamber shear, thereby improving the repeatability of bending and reducing its coupling with axial modes. Twisting is deliberately separated from the pneumatic subsystem entirely, actuated instead by a servo-driven end-effector ring — a design decision that trades complexity for clean decoupling.`,
  ];

  const nextDesignBlocks: ChapterBlock[] = [
    (designHeading as ChapterBlock) || {
      type: "heading",
      level: 1,
      text: "Design Methodology",
      anchor: "design-methodology",
    },
    ...improvedDesignParas.map(paragraph),
    ...(existingDesignEquation ? [existingDesignEquation] : []),
  ];

  const controlHeading = (control.blocks as ChapterBlock[]).find(
    (b) => b.type === "heading" && b.level === 1
  );

  const improvedControlParas = [
    `The team implemented a practical control architecture around an Arduino Mega, selected over the ESP32 for its higher digital I/O count, additional hardware UART ports, and stable PWM channel availability — all required to independently drive four solenoid valves, four air pumps, and a servo motor without pin multiplexing or timing contention.`,
    `To generate repeatable pneumatic actuation, the team built a manifold that routes each motion primitive through a dedicated solenoid valve and pump channel. This one-actuator-per-channel layout simplifies debugging and makes mode decoupling measurable because each valve command maps to a single chamber group instead of a shared pressure line.`,
    `The controller drives valves using PWM duty-cycle scheduling rather than continuous open-loop inflation because elastomeric chambers respond nonlinearly with pressure and exhibit hysteresis. By modulating duty cycle and inflation windows, the team can sweep input energy in small increments and record pressure–deformation curves without hardware changes.`,
    `For twisting, the team avoided pneumatic torsion because it couples strongly to bending and axial strain in monolithic silicone geometries. Instead, a servo-driven end-effector ring provides rotation as a mechanically isolated primitive, allowing the pneumatic subsystem to focus on bending/axial modes while the servo enforces clean rotational kinematics.`,
    `For experiments, the team used an IR remote as a low-cost, low-latency human interface and mapped buttons to primitives and intensity presets. Safety interlocks (timeouts, bounded inflation windows, and rapid venting behavior) reduce the risk of rupture during repeated trials and make the test procedure reproducible across operators.`,
  ];

  const nextControlBlocks: ChapterBlock[] = [
    (controlHeading as ChapterBlock) || {
      type: "heading",
      level: 1,
      text: "Control System",
      anchor: "control-system",
    },
    ...improvedControlParas.map(paragraph),
  ];

  await Chapter.updateOne(
    { slug: "design-methodology" },
    { $set: { blocks: nextDesignBlocks } }
  );
  await Chapter.updateOne(
    { slug: "control-system" },
    { $set: { blocks: nextControlBlocks } }
  );

  console.log("Updated chapters: design-methodology, control-system");
  await mongoose.disconnect();
}

await main();

