# ⚡ 3D Adder Circuit Virtual Lab

> **An interactive 3D virtual laboratory for learning, simulating, and understanding Half Adder and Full Adder circuits through visual digital logic simulation.**

![3D Adder Circuit Virtual Lab](https://img.shields.io/badge/Project-3D%20Virtual%20Lab-00d4ff?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-3D%20Visualization-black?style=for-the-badge\&logo=three.js)
![HTML](https://img.shields.io/badge/HTML5-Web%20Application-orange?style=for-the-badge\&logo=html5)
![JavaScript](https://img.shields.io/badge/JavaScript-Interactive%20Logic-yellow?style=for-the-badge\&logo=javascript)
![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

---

## 📌 Overview

**3D Adder Circuit Virtual Lab** is an interactive web-based educational application designed to help students understand **Digital Logic Design** and **Adder Circuits** through a visual and interactive environment.

Instead of studying circuit diagrams only on paper, users can interact with a simulated 3D circuit, change digital inputs, observe logic gates, and see the resulting **Sum** and **Carry** outputs in real time.

The virtual lab covers:

* Half Adder
* Full Adder
* Logic gates
* Digital inputs
* Output LEDs
* Real-time Sum and Carry calculation
* Interactive 3D circuit visualization
* Practice and Viva questions

---

## 🎯 Objectives

The main objectives of this project are:

1. To provide a simple and interactive way to learn adder circuits.
2. To visually demonstrate the working of Half Adder and Full Adder circuits.
3. To allow students to experiment with different binary input combinations.
4. To show circuit outputs dynamically.
5. To connect theoretical Digital Logic concepts with practical simulation.
6. To provide a virtual alternative for basic laboratory experimentation.

---

## ✨ Key Features

| Feature                   | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| 🧮 **Half Adder**         | Simulates addition of two binary inputs                |
| ➕ **Full Adder**          | Simulates addition of two inputs with Carry-In         |
| 🧊 **3D Visualization**   | Interactive 3D representation of the circuit           |
| 🔘 **Interactive Inputs** | Change digital input states and observe results        |
| 💡 **Output LEDs**        | Visual indication of Sum and Carry                     |
| 🔌 **Logic Gates**        | Visual representation of the logic used in the circuit |
| ⚡ **Real-Time Output**    | Outputs update according to the selected inputs        |
| 📚 **Learning Interface** | Includes explanations and circuit concepts             |
| 🎯 **Practice & Viva**    | Helps students revise important concepts               |
| 🌐 **Web-Based**          | Runs directly in a modern web browser                  |

---

## 🧠 Concepts Covered

### Half Adder

A Half Adder adds two binary inputs:

* **A**
* **B**

It produces two outputs:

**Sum**

```text
Sum = A ⊕ B
```

**Carry**

```text
Carry = A · B
```

### Half Adder Truth Table

| A | B | Sum | Carry |
| - | - | --- | ----- |
| 0 | 0 | 0   | 0     |
| 0 | 1 | 1   | 0     |
| 1 | 0 | 1   | 0     |
| 1 | 1 | 0   | 1     |

---

### Full Adder

A Full Adder adds three binary inputs:

* **A**
* **B**
* **Cin (Carry-In)**

It produces:

* **Sum**
* **Cout (Carry-Out)**

**Sum**

```text
Sum = A ⊕ B ⊕ Cin
```

**Carry**

```text
Cout = AB + BCin + ACin
```

### Full Adder Truth Table

| A | B | Cin | Sum | Cout |
| - | - | --- | --- | ---- |
| 0 | 0 | 0   | 0   | 0    |
| 0 | 0 | 1   | 1   | 0    |
| 0 | 1 | 0   | 1   | 0    |
| 0 | 1 | 1   | 0   | 1    |
| 1 | 0 | 0   | 1   | 0    |
| 1 | 0 | 1   | 0   | 1    |
| 1 | 1 | 0   | 0   | 1    |
| 1 | 1 | 1   | 1   | 1    |

---

## 🖥️ Application Sections

The virtual laboratory is organized into four major sections:

### 1. Overview

Introduces the basic concepts of digital addition and explains the purpose of the virtual laboratory.

### 2. Half Adder 3D

Provides an interactive 3D simulation of a Half Adder with:

* Two binary inputs
* Logic gates
* Circuit connections
* Sum output
* Carry output
* Visual output indicators

### 3. Full Adder 3D

Provides an interactive 3D simulation of a Full Adder with:

* A input
* B input
* Carry-In
* Logic gates
* Sum output
* Carry-Out
* Interactive circuit visualization

### 4. Practice & Viva

Provides a learning and revision section containing questions related to:

* Half Adder
* Full Adder
* Logic gates
* Truth tables
* Sum and Carry
* Digital logic fundamentals

---

## 🛠️ Technologies Used

| Technology        | Purpose                             |
| ----------------- | ----------------------------------- |
| **HTML5**         | Web application structure           |
| **CSS3**          | User interface and visual design    |
| **JavaScript**    | Circuit logic and interactivity     |
| **Three.js**      | 3D visualization                    |
| **OrbitControls** | Interactive 3D camera controls      |
| **GitHub**        | Version control and project hosting |

The project uses a local copy of Three.js and OrbitControls with a CDN fallback, allowing the application to continue loading the required 3D libraries when the local files are unavailable.

---

## 📁 Project Structure

```text
3D-Adder-Circuit-Virtual-Lab/
│
├── index.html
│
├── js/
│   ├── three.min.js
│   └── OrbitControls.js
│
└── README.md
```

### File Description

**`index.html`**

Contains the main application interface, styling, circuit simulation logic, 3D scene, learning content, and navigation.

**`js/three.min.js`**

Three.js library used for creating and rendering the 3D environment.

**`js/OrbitControls.js`**

Provides interactive camera controls for navigating the 3D scene.

**`README.md`**

Project documentation and usage instructions.

---

## 🚀 How to Run the Project

### Method 1 — Directly in Browser

1. Download or clone the repository.
2. Open the project folder.
3. Open `index.html` in a modern web browser.
4. Start exploring the virtual laboratory.

### Method 2 — Using VS Code

Clone the repository:

```bash
git clone https://github.com/vidhichavhan18-cell/3D-Adder-Circuit-Virtual-Lab.git
```

Navigate to the project:

```bash
cd 3D-Adder-Circuit-Virtual-Lab
```

Open the folder in **Visual Studio Code**.

Then open `index.html` using a local development server such as **Live Server**.

---

## 🎮 How to Use

1. Open the virtual laboratory.
2. Start from the **Overview** section.
3. Select **Half Adder 3D** or **Full Adder 3D**.
4. Change the digital input values.
5. Observe the logic gates and circuit behaviour.
6. Check the **Sum** and **Carry** outputs.
7. Rotate and explore the 3D circuit.
8. Use the **Practice & Viva** section for revision.

---

## 🔄 Working Principle

The basic working flow of the application is:

```text
        User Input
            │
            ▼
     Binary Input Selection
            │
            ▼
       Logic Processing
            │
            ▼
       Logic Gate Network
            │
       ┌────┴────┐
       ▼         ▼
     SUM       CARRY
       │         │
       ▼         ▼
   Output LED  Output LED
```

For the Full Adder:

```text
 A ─────┐
        │
 B ─────┼──► Full Adder Logic ───► SUM
        │
Cin ────┘                     └──► CARRY
```

---

## 🎓 Educational Use

This project can be used by:

* Engineering students
* Digital Logic Design students
* Electronics students
* Computer Science students
* Teachers for classroom demonstrations
* Students preparing for practical examinations and viva

It is particularly useful for understanding the relationship between:

**Truth Tables → Logic Gates → Circuit Behaviour → Output**

---

## 💡 Why This Project?

Traditional digital logic learning often relies on:

* Circuit diagrams
* Textbook explanations
* Static truth tables
* Physical laboratory components

This project provides an interactive environment where students can **see and experiment with the circuit behaviour** instead of only reading about it.

The goal is to make basic digital electronics concepts more visual, accessible, and easier to understand.

---

## 🔮 Future Enhancements

Possible future improvements include:

* [ ] Interactive wire connection system
* [ ] More digital logic circuits
* [ ] Subtractor circuits
* [ ] Multiplexer and Demultiplexer
* [ ] Flip-Flops
* [ ] Counter circuits
* [ ] Seven-segment display simulation
* [ ] Circuit construction mode
* [ ] More practice questions
* [ ] Progress tracking
* [ ] Mobile optimization
* [ ] Web-based deployment

---

## 📊 Project Highlights

```text
Project Type     : Educational Web Application
Domain           : Digital Electronics
Main Topic       : Adder Circuits
Visualization    : 3D
Simulation       : Half Adder + Full Adder
Platform         : Web Browser
Frontend         : HTML + CSS + JavaScript
3D Engine        : Three.js
```

---

## 🤝 Contributing

Contributions and suggestions are welcome.

To contribute:

```bash
# Fork the repository

# Clone your fork
git clone <your-fork-url>

# Create a new branch
git checkout -b feature/your-feature

# Make your changes

# Commit your changes
git add .
git commit -m "Add new feature"

# Push your branch
git push origin feature/your-feature
```

Then open a Pull Request on GitHub.

---

## 📄 License

This project is created for **educational and academic purposes**.

If you reuse or modify the project, please provide appropriate credit to the original repository.

---

## 👩‍💻 Author

**Vidhi Chavhan**

B.Tech — Artificial Intelligence & Data Science

GitHub:
https://github.com/vidhichavhan18-cell

Project Repository:
https://github.com/vidhichavhan18-cell/3D-Adder-Circuit-Virtual-Lab

---

## ⭐ Acknowledgement

This project was developed as an educational initiative to demonstrate **Digital Logic Design concepts using interactive 3D web technologies**.

If you find this project useful for learning or teaching, consider giving the repository a ⭐ on GitHub.

---

<p align="center">

**⚡ 3D Adder Circuit Virtual Lab**

*Learn Digital Logic. Visualize the Circuit. Understand the Output.*

</p>
