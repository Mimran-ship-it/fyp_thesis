import { dbConnect } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { Chapter, type ChapterBlock } from "@/models/Chapter";
import { User } from "@/models/User";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "fyp2025";

function blocksForAbstract(): ChapterBlock[] {
  return [
    { type: "heading", level: 1, text: "Abstract", anchor: "abstract" },
    {
      type: "paragraph",
      text:
        "This thesis presents the design, fabrication, and control of a bio-inspired soft robotic gripping mechanism, motivated by the dexterity of an elephant’s trunk. The core contribution is a trunk-like soft arm that decouples four motion primitives—bending, elongation, contraction, and twisting—within a single modular body using a Type C deep-chamber Pneu-Net architecture and a tri-leg ring (\"fidget-spinner\") topology to guide and constrain deformation. A peak axial extension of 195 mm is achieved while maintaining controllable bending and a decoupled twisting mode.",
    },
    {
      type: "paragraph",
      text:
        "Finite element analysis (FEA) using ANSYS is performed with a Yeoh hyperelastic constitutive model fitted for Ecoflex 00-30 silicone. Simulated pressure–deformation responses are validated against experimental measurements with an average error margin of approximately 8%, demonstrating the predictive fidelity of the model for design iteration. A practical control system is implemented using an Arduino-based pneumatic manifold with solenoid valves, air pumps, and a servo-driven twisting module, enabling real-time mode selection and modulation via IR remote and PWM-driven valve timing.",
    },
  ];
}

function blocksForIntroduction(): ChapterBlock[] {
  return [
    { type: "heading", level: 1, text: "Introduction", anchor: "introduction" },
    {
      type: "paragraph",
      text:
        "Robotics has historically favored rigid-link mechanisms due to their well-defined kinematics and high positional accuracy. However, tasks that require safe physical interaction, adaptive grasping, and compliance—especially in unstructured environments—have driven the evolution toward soft robotics. Soft robots leverage elastomeric materials, distributed actuation, and morphological computation to achieve inherent safety and environmental adaptability, albeit at the cost of nonlinear mechanics, hysteresis, and challenging modeling.",
    },
    {
      type: "paragraph",
      text:
        "Bio-inspiration provides a design vocabulary for addressing these challenges. The elephant trunk is a canonical example of a muscular hydrostat continuum structure capable of rich manipulation without skeletal support. Similarly, industrial research such as Festo’s Bionic Handling Assistant demonstrates the feasibility of pneumatically-actuated, compliant continuum manipulators for human-safe interaction and adaptive handling. This thesis extends such ideas through a mechanically guided soft arm that aims to separate (decouple) common deformation modes into controllable primitives suitable for systematic characterization and closed-loop control.",
    },
  ];
}

function blocksForDesignMethodology(): ChapterBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "Design Methodology",
      anchor: "design-methodology",
    },
    {
      type: "paragraph",
      text:
        "The design evolved across three primary iterations. Model A (ribbed) established baseline bending through classical Pneu-Net chambers but exhibited mode coupling and limited axial deformation. Model B improved chamber uniformity and added guidance features, yet twisting and elongation remained strongly coupled under practical pressure ranges. The final Model C adopts a deep-chamber Pneu-Net (Type C) architecture, increasing the effective pneumatic moment arm and enabling larger strain before chamber wall contact or self-interference.",
    },
    {
      type: "paragraph",
      text:
        "A distinctive tri-leg ring topology (resembling a fidget-spinner) is integrated as a passive constraint and deformation guide. The ring geometry acts as a distributed kinematic scaffold that modulates cross-sectional ovalization and shearing, improving repeatability and aiding decoupling between bending and axial modes. Twisting is implemented as a dedicated primitive via a servo-driven end effector ring, allowing rotation to be actuated independently from pneumatic inflation.",
    },
    {
      type: "equation",
      latex:
        "\\kappa = \\frac{\\theta}{L},\\qquad \\mathbf{p}(s)=\\begin{bmatrix}\\frac{1}{\\kappa}(1-\\cos(\\kappa s))\\\\0\\\\\\frac{1}{\\kappa}\\sin(\\kappa s)\\end{bmatrix}",
      caption:
        "Constant-curvature backbone kinematics used as a compact model for bending characterization (planar case).",
      displayMode: true,
    },
  ];
}

function blocksForFea(): ChapterBlock[] {
  return [
    { type: "heading", level: 1, text: "FEA & Analysis", anchor: "fea-analysis" },
    {
      type: "paragraph",
      text:
        "Nonlinear finite element analysis is used to predict pressure-driven deformation and to guide the chamber geometry and wall thickness selection. Ecoflex 00-30 is modeled as a nearly incompressible hyperelastic material. The Yeoh model is selected due to its robustness for large strains and its compatibility with uniaxial test fitting, providing stable behavior in simulation while capturing the stiffening trend at higher strains.",
    },
    {
      type: "equation",
      latex:
        "W = C_{10}(I_1-3)+C_{20}(I_1-3)^2+C_{30}(I_1-3)^3",
      caption: "Yeoh strain-energy density function (incompressible form).",
      displayMode: true,
    },
    {
      type: "table",
      title: "Yeoh Model Parameters (Ecoflex 00-30)",
      caption:
        "Placeholder parameters. Replace with fitted values from uniaxial testing used in ANSYS.",
      columns: [
        { key: "param", label: "Parameter" },
        { key: "value", label: "Value" },
        { key: "unit", label: "Unit" },
      ],
      rows: [
        { param: "C10", value: "TBD", unit: "MPa" },
        { param: "C20", value: "TBD", unit: "MPa" },
        { param: "C30", value: "TBD", unit: "MPa" },
      ],
    },
    {
      type: "table",
      title: "Pressure–Deformation Dataset (Model C)",
      caption:
        "Populate using experimental measurements and corresponding FEA outputs to report the ~8% error margin.",
      columns: [
        { key: "pressure_kpa", label: "Pressure", unit: "kPa" },
        { key: "bend_deg", label: "Bending", unit: "deg" },
        { key: "elong_mm", label: "Elongation", unit: "mm" },
        { key: "contract_mm", label: "Contraction", unit: "mm" },
        { key: "twist_deg", label: "Twisting", unit: "deg" },
      ],
      rows: [
        {
          pressure_kpa: 5,
          bend_deg: 90,
          elong_mm: "TBD",
          contract_mm: "TBD",
          twist_deg: "TBD",
        },
        {
          pressure_kpa: 10,
          bend_deg: "TBD",
          elong_mm: "TBD",
          contract_mm: "TBD",
          twist_deg: "TBD",
        },
      ],
    },
  ];
}

function blocksForFabrication(): ChapterBlock[] {
  return [
    { type: "heading", level: 1, text: "Fabrication", anchor: "fabrication" },
    {
      type: "paragraph",
      text:
        "Fabrication is carried out using silicone casting with multi-part molds designed to realize the deep-chamber Pneu-Net geometry. Early mold iterations exhibited undercut-related demolding failure, trapped air leading to porosity, and inconsistent wall thickness at the chamber interface. These issues manifested as leak paths and reduced repeatability across samples.",
    },
    {
      type: "paragraph",
      text:
        "The final fabrication workflow uses redesigned molds with improved parting lines, alignment features, and venting. Release agents are applied to reduce adhesion and to prevent tearing during demolding. Degassing procedures and controlled pour techniques are used to minimize entrapped bubbles. The resulting casts demonstrate improved surface integrity and consistent pneumatic performance across repeated inflation cycles.",
    },
  ];
}

function blocksForControlSystem(): ChapterBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "Control System",
      anchor: "control-system",
    },
    {
      type: "paragraph",
      text:
        "A practical, production-oriented control architecture is implemented around an Arduino Mega (or ESP32) interfaced with a solenoid valve manifold and air pumps. The system supports discrete mode selection (bending, elongation, contraction, twisting) and continuous modulation via PWM timing and pressure setpoint scheduling. Twisting is actuated by a servo motor driving a rotational ring, enabling decoupled rotation at the distal end independent of pneumatic inflation state.",
    },
    {
      type: "paragraph",
      text:
        "An IR remote provides a low-cost human interface for real-time experiments, mapping buttons to motion primitives and to intensity levels (e.g., valve duty-cycle and pump activation windows). The control logic is structured as a finite state machine with safety interlocks (timeout, pressure-limited inflation windows, and emergency venting) to reduce the risk of material rupture during repeated testing.",
    },
  ];
}

function blocksForResults(): ChapterBlock[] {
  return [
    {
      type: "heading",
      level: 1,
      text: "Results & Discussion",
      anchor: "results-discussion",
    },
    {
      type: "paragraph",
      text:
        "Model C demonstrates improved primitive decoupling compared to earlier designs, enabling characterization under repeatable boundary conditions. Representative performance includes 90° bending at 5 kPa and an independently actuated twisting capability approaching 180° under controlled servo rotation, while the pneumatic subsystems provide significant axial extension (up to 195 mm). These results highlight that geometric guidance (tri-leg ring topology) can reduce mode coupling by constraining undesired shear and ovalization.",
    },
    {
      type: "paragraph",
      text:
        "Compared against state-of-the-art continuum manipulators, the proposed architecture emphasizes manufacturability and controllable primitives rather than high-dimensional omnidirectional bending. In relation to pneumatically driven continuum arms such as Festo’s Bionic Handling Assistant, this work focuses on a compact research platform that enables systematic pressure–deformation mapping and the integration of a distinct rotational primitive. Future work includes embedded sensing (soft strain sensors / IMU), model-based control leveraging calibrated hyperelastic simulation, and higher-level grasp planning using primitive composition.",
    },
  ];
}

export async function ensureSeeded() {
  await dbConnect();

  // Make seeding race-safe in dev by using upserts (no duplicate inserts).
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await User.updateOne(
    { username: ADMIN_USERNAME },
    {
      $setOnInsert: {
        username: ADMIN_USERNAME,
        passwordHash,
        role: "admin",
        isActive: true,
      },
    },
    { upsert: true }
  );

  const seed = [
    {
      slug: "abstract",
      title: "Abstract",
      chapterNumber: 1,
      order: 1,
      summary: "Decoupled bending, elongation, contraction, twisting; 195 mm extension.",
      blocks: blocksForAbstract(),
    },
    {
      slug: "introduction",
      title: "Introduction",
      chapterNumber: 2,
      order: 2,
      summary: "From rigid robotics to soft, with elephant trunk bio-inspiration.",
      blocks: blocksForIntroduction(),
    },
    {
      slug: "design-methodology",
      title: "Design Methodology",
      chapterNumber: 3,
      order: 3,
      summary: "Model A→B→C evolution and the tri-leg ring topology.",
      blocks: blocksForDesignMethodology(),
    },
    {
      slug: "fea-analysis",
      title: "FEA & Analysis",
      chapterNumber: 4,
      order: 4,
      summary: "ANSYS validation using a Yeoh hyperelastic model (Ecoflex 00-30).",
      blocks: blocksForFea(),
    },
    {
      slug: "fabrication",
      title: "Fabrication",
      chapterNumber: 5,
      order: 5,
      summary: "Mold undercuts/porosity issues and the final casting workflow.",
      blocks: blocksForFabrication(),
    },
    {
      slug: "control-system",
      title: "Control System",
      chapterNumber: 6,
      order: 6,
      summary: "Arduino-based pneumatic manifold control with IR/PWM; servo twist.",
      blocks: blocksForControlSystem(),
    },
    {
      slug: "results-discussion",
      title: "Results & Discussion",
      chapterNumber: 7,
      order: 7,
      summary: "Performance metrics and comparison to continuum robots.",
      blocks: blocksForResults(),
    },
  ];

  await Chapter.bulkWrite(
    seed.map((c) => ({
      updateOne: {
        filter: { slug: c.slug },
        update: {
          $setOnInsert: {
            ...c,
            visibility: { isPublished: true, isVisibleInToc: true },
          },
        },
        upsert: true,
      },
    }))
  );

  // One-time prose upgrades (only if chapter still has the older seed text).
  const design = await Chapter.findOne({ slug: "design-methodology" }).lean();
  if (design) {
    const blocks = (design.blocks || []) as ChapterBlock[];
    const p = blocks.find((b) => b.type === "paragraph") as
      | Extract<ChapterBlock, { type: "paragraph" }>
      | undefined;
    if (p?.text?.includes("The design evolved across three primary iterations.")) {
      const heading = blocks.find((b) => b.type === "heading" && b.level === 1) || {
        type: "heading",
        level: 1,
        text: "Design Methodology",
        anchor: "design-methodology",
      };
      const eq = blocks.find((b) => b.type === "equation");
      const upgraded: ChapterBlock[] = [
        heading,
        {
          type: "paragraph",
          text:
            "The design process was driven by a central constraint: achieving independent actuation of four motion primitives—bending, elongation, contraction, and twisting—within a single monolithic silicone body. This requirement ruled out conventional single-chamber Pneu-Net designs, which inherently couple bending and axial extension under uniform inflation pressure.",
        },
        {
          type: "paragraph",
          text:
            "Model A employed a ribbed Pneu-Net chamber geometry, selected for its established bending performance in the literature. While baseline bending was confirmed, the ribbed geometry provided insufficient resistance to axial elongation, and mode coupling was observed at pressures exceeding 3 kPa. The absence of cross-sectional constraints allowed undesired ovalization of the arm body.",
        },
        {
          type: "paragraph",
          text:
            "Model B introduced chamber uniformity improvements and passive guidance ribs along the outer wall to resist ovalization. Bending repeatability improved; however, twisting and elongation remained strongly coupled under the pressure ranges required for practical manipulation. The guidance features increased wall stiffness unevenly, introducing asymmetric deformation not present in simulation.",
        },
        {
          type: "paragraph",
          text:
            "The final Model C adopts a Type C deep-chamber Pneu-Net architecture, selected because deeper chambers increase the pneumatic moment arm — the perpendicular distance between the pressurized face and the neutral bending axis — enabling larger angular deformation before chamber wall contact or geometric self-interference. This geometry was validated first in ANSYS FEA before committing to fabrication.",
        },
        {
          type: "paragraph",
          text:
            'The tri-leg ring topology ("fidget-spinner" constraint ring) was introduced as a passive kinematic scaffold. Its geometric action is to resist cross-sectional ovalization and constrain inter-chamber shear, thereby improving the repeatability of bending and reducing its coupling with axial modes. Twisting is deliberately separated from the pneumatic subsystem entirely, actuated instead by a servo-driven end-effector ring — a design decision that trades complexity for clean decoupling.',
        },
        ...(eq ? [eq] : []),
      ];
      await Chapter.updateOne({ slug: "design-methodology" }, { $set: { blocks: upgraded } });
    }
  }

  const control = await Chapter.findOne({ slug: "control-system" }).lean();
  if (control) {
    const blocks = (control.blocks || []) as ChapterBlock[];
    const p = blocks.find((b) => b.type === "paragraph") as
      | Extract<ChapterBlock, { type: "paragraph" }>
      | undefined;
    if (p?.text?.includes("A practical, production-oriented control architecture is implemented")) {
      const heading = blocks.find((b) => b.type === "heading" && b.level === 1) || {
        type: "heading",
        level: 1,
        text: "Control System",
        anchor: "control-system",
      };
      const upgraded: ChapterBlock[] = [
        heading,
        {
          type: "paragraph",
          text:
            "The team implemented a practical control architecture around an Arduino Mega, selected over the ESP32 for its higher digital I/O count, additional hardware UART ports, and stable PWM channel availability — all required to independently drive four solenoid valves, four air pumps, and a servo motor without pin multiplexing or timing contention.",
        },
        {
          type: "paragraph",
          text:
            "To generate repeatable pneumatic actuation, the team built a manifold that routes each motion primitive through a dedicated solenoid valve and pump channel. This one-actuator-per-channel layout simplifies debugging and makes mode decoupling measurable because each valve command maps to a single chamber group instead of a shared pressure line.",
        },
        {
          type: "paragraph",
          text:
            "The controller drives valves using PWM duty-cycle scheduling rather than continuous open-loop inflation because elastomeric chambers respond nonlinearly with pressure and exhibit hysteresis. By modulating duty cycle and inflation windows, the team can sweep input energy in small increments and record pressure–deformation curves without hardware changes.",
        },
        {
          type: "paragraph",
          text:
            "For twisting, the team avoided pneumatic torsion because it couples strongly to bending and axial strain in monolithic silicone geometries. Instead, a servo-driven end-effector ring provides rotation as a mechanically isolated primitive, allowing the pneumatic subsystem to focus on bending/axial modes while the servo enforces clean rotational kinematics.",
        },
        {
          type: "paragraph",
          text:
            "For experiments, the team used an IR remote as a low-cost, low-latency human interface and mapped buttons to primitives and intensity presets. Safety interlocks (timeouts, bounded inflation windows, and rapid venting behavior) reduce the risk of rupture during repeated trials and make the test procedure reproducible across operators.",
        },
      ];
      await Chapter.updateOne({ slug: "control-system" }, { $set: { blocks: upgraded } });
    }
  }
}

