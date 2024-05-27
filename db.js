const { Pool } = require("pg");
const { text } = require("stream/consumers");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "paulo",
    port: 5432,
    database: "skatepark"
})

const insertarSkater = async (datos) => {

    const consulta = {
        text: "INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        values: datos
    };
    const result = await pool.query(consulta);
    return result
};

const consultarSkaters = async () => {
    const result = await pool.query("SELECT * FROM skaters");
    // console.log(result.rows);
    return result.rows;

}

const editar = async (datos) => {
    const consulta = {
        text: "UPDATE skaters SET nombre=$2, password=$3, anos_experiencia=$4, especialidad=$5 WHERE id=$1 RETURNING *",
        values: datos
    }
    const result = await pool.query(consulta);
    return result;
}

const editarStatus = async (datos) => {
    const consulta = {
        text: "UPDATE skaters SET estado=$2 WHERE id=$1 RETURNING *",
        values: datos
    }
    const result = await pool.query(consulta);
    return result;
}

const eliminar = async (id) => {
    const result = await pool.query("DELETE FROM skaters WHERE id=$1 RETURNING *", [id]);

}


const consultaFoto = async (datos) => {
    const consulta = {
        text: `SELECT foto FROM skaters WHERE id=${datos}`
    }
    const result = await pool.query(consulta)

    return result.rows;
}



module.exports = { insertarSkater, consultarSkaters, editar, editarStatus, eliminar, consultaFoto };