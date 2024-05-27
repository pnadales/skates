// Importaciones
const express = require("express");
const app = express();
const exphbs = require("express-handlebars");
const expressFileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const secretKey = "Shhhh";


const { insertarSkater, consultarSkaters, editar, eliminar, insertarTrans, consultaTrans } = require('./db')


let skaters = [
    {
        id: 1,
        email: 'kb@fbi.com',
        nombre: 'Kill Bill',
        password: 'me',
        anos_experiencia: 4,
        especialidad: "FullStack",
        foto: "/uploads/Danny.jpg",
        estado: false
    },
    {
        id: 2,
        email: 'fg@fbi.com',
        nombre: 'Forrest Gump',
        password: 'you',
        anos_experiencia: 6,
        especialidad: "DBA",
        foto: "/uploads/Danny.jpg",
        estado: true
    },
    {
        id: 3,
        email: 'jm@fbi.com',
        nombre: 'Jonh Meyers',
        password: 'he',
        anos_experiencia: 8,
        especialidad: "FrontEnd",
        foto: "/uploads/Danny.jpg",
        estado: true
    },
]



// Server
app.listen(3000, () => console.log("Servidor encendido PORT 3000!"));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static(__dirname + "/public"));
app.use(
    expressFileUpload({
        limits: 5000000,
        abortOnLimit: true,
        responseOnLimit: "El tamaño de la imagen supera el límite permitido",
    })
);
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main",
        layoutsDir: `${__dirname}/views/mainLayout`,
    })
);
app.set("view engine", "handlebars");


// Rutas asociadas a los handlebars
app.get("/", async (req, res) => {
    try {
        // console.log("funciona: ", { skaters });
        skaters = await consultarSkaters()
        // console.log("no funciona", skaters)

        res.render("Home", { skaters });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.get("/registro", (req, res) => {
    res.render("Registro");
});

app.get("/perfil", (req, res) => {
    const { token } = req.query
    jwt.verify(token, secretKey, (err, skater) => {
        if (err) {
            res.status(500).send({
                error: `Algo salió mal...`,
                message: err.message,
                code: 500
            })
        } else {
            res.render("Perfil", { skater });
        }
    })
});

app.get("/login", (req, res) => {
    res.render("Login");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    try {
        const skater = skaters.find((s) => s.email == email &&
            s.password == password);

        const token = jwt.sign(skater, secretKey)
        res.status(200).send(token)

    } catch (e) {

        console.log(e)
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })

    };
});

app.get("/Admin", async (req, res) => {
    try {
        res.render("Admin", { skaters });
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});


// API REST de Skaters

app.get("/skaters", async (req, res) => {

    try {
        res.status(200).send(skaters);
    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.post("/skaters", async (req, res) => {
    const skater = req.body;
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send("No se encontro ningun archivo en la consulta");
    }
    const { files } = req
    const { foto } = files;
    const { name } = foto;
    const pathPhoto = `/uploads/${name}`

    const datos = [skater.email, skater.nombre, skater.password, skater.anos_experiencia, skater.especialidad, pathPhoto, false]
    // console.log(datos);
    insertarSkater(datos)
    // console.log("Valor del req.body: ", skater);
    // console.log("Nombre de imagen: ", name);
    // console.log("Ruta donde subir la imagen: ", pathPhoto);


    foto.mv(`${__dirname}/public${pathPhoto}`, async (err) => {
        try {
            if (err) throw err
            skater.foto = pathPhoto
            skaters.push(skater);
            res.status(201).redirect("/");
        } catch (e) {
            console.log(e)
            res.status(500).send({
                error: `Algo salió mal... ${e}`,
                code: 500
            })
        };

    });
})

app.put("/skaters", async (req, res) => {
    const { id, nombre, anos_experiencia, especialidad } = req.body;
    console.log("Valor del body: ", id, nombre, anos_experiencia, especialidad);
    try {
        const skaterB = skaters.findIndex((s) => s.id == id);
        //        if (skaterB) {
        skaters[skaterB].nombre = nombre;
        skaters[skaterB].anos_experiencia = anos_experiencia;
        skaters[skaterB].especialidad = especialidad;
        res.status(200).send("Datos actualizados con éxito");
        // } else {
        //     res.status(400).send("No existe este Skater");
        // }

    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.put("/skaters/status/:id", async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    console.log("Valor de estado recibido por body: ", estado)
    try {
        const skaterB = skaters.findIndex((s) => s.id == id);

        //if (skaterB !== -1) {
        skaters[skaterB].estado = estado;
        res.status(200).send("Estado Actualizado con éxito");
        // } else {
        //     res.status(400).send("No existe este Skater");
        // }

    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

app.delete("/skaters/:id", async (req, res) => {
    const { id } = req.params
    try {
        const skaterB = skaters.findIndex((s) => s.id == id);

        if (skaterB !== -1) {
            skaters.splice(skaterB, 1);
            res.status(200).send("Skater Eliminado con éxito");
        } else {
            res.status(400).send("No existe este Skater");
        }

    } catch (e) {
        res.status(500).send({
            error: `Algo salió mal... ${e}`,
            code: 500
        })
    };
});

