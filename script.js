let tiempoInicio;
let intervalo;

// Simulación de base de datos de usuarios (Esto después vendrá de MongoDB)
const usuariosValidos = [
    { rut: "16668813-0", pass: "Administrador", nombre: "Angela Mardones", rol: "admin" }
];

async function autenticar() {
  const rutInput = document.getElementById('login_rut').value.trim();
  const passInput = document.getElementById('login_pass').value.trim();

  if (!rutInput || !passInput) {
    alert('Por favor ingresa tu RUT y Contraseña');
    return;
  }

  try {
    const res = await fetch('https://proyecto-frontel.onrender.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_rut_ejecutivo: rutInput,
        admin_pass_ejecutivo: passInput
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert('¡Bienvenido/a ' + (data.nombre || '') + '!');
      
      // Oculta pantalla de login y muestra el panel correspondiente
      document.getElementById('seccion-login').style.display = 'none';
    
      // Muestra el panel según el rol del usuario
      if (data.rol === 'admin') {
        document.getElementById('seccion-admin').style.display = 'block';
        if (typeof cargarEjecutivos === 'function') cargarEjecutivos();
      } else {
        document.getElementById('seccion-atencion').style.display = 'block';
      }
    } else {
      alert('Error de autenticación: ' + (data.mensaje || 'Credenciales incorrectas'));
    }

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert('Error al conectar con el servidor');
  }
}

function iniciarAtencion() {
    const rut = document.getElementById('rut_cliente').value;
    const num = document.getElementById('num_cliente').value;

    // VALIDACIÓN: Permite pasar si tiene RUT o si tiene Número de Cliente
    if (rut === "" && num === "") {
        return alert("Error: Debe ingresar el RUT o el Número de Cliente para iniciar.");
    }

    document.getElementById('paso-identificacion').style.display = 'none';
    document.getElementById('paso-cierre').style.display = 'block';

    tiempoInicio = new Date();
    intervalo = setInterval(actualizarCronometro, 1000);
}

function actualizarCronometro() {
    const ahora = new Date();
    const diff = ahora - tiempoInicio;
    const m = Math.floor(diff / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    document.getElementById('cronometro').innerText = `00:${m}:${s}`;
}

async function finalizarAtencion() {
  const tiempoFinal = document.getElementById('cronometro').innerText;
  const rut = document.getElementById('rut_cliente').value;
  const num = document.getElementById('num_cliente').value;
  const motivo = document.getElementById('motivo_atencion')?.value || 'Consulta General';

  clearInterval(intervalo);

  // Construir el objeto a enviar a MongoDB
  const datosAtencion = {
    rut_cliente: rut,
    num_cliente: num,
    motivo: motivo,
    tiempo_duracion: tiempoFinal,
    fecha: new Date()
  };

  try {
    const res = await fetch('https://proyecto-frontel.onrender.com/api/atenciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosAtencion)
    });

    if (res.ok) {
      alert(`¡Atención registrada en MongoDB!\nRUT: ${rut || 'N/A'}\nN° Cliente: ${num || 'N/A'}\nTiempo: ${tiempoFinal}`);
      
      // Reiniciar vista
      document.getElementById('paso-cierre').style.display = 'none';
      document.getElementById('paso-identificacion').style.display = 'block';
      document.getElementById('rut_cliente').value = '';
      document.getElementById('num_cliente').value = '';
      document.getElementById('cronometro').innerText = '00:00:00';
    } else {
      const err = await res.json();
      alert('Error al guardar en MongoDB: ' + (err.error || 'Error desconocido'));
    }
  } catch (error) {
    console.error('Error al guardar atención:', error);
    alert('Error de conexión con el servidor');
  }
}

function volverAlModulo() {
    // 1. Limpiar los textos escritos
    document.getElementById('rut_cliente').value = "";
    document.getElementById('num_cliente').value = "";
    document.getElementById('cronometro').innerText = "00:00:00";
    
    // 2. Volver a mostrar el paso 1 y ocultar el paso 2
    document.getElementById('paso-identificacion').style.display = 'block';
    document.getElementById('paso-cierre').style.display = 'none';
}

// Formulario de Registro de Ejecutivos
async function guardarEjecutivo() {
  const datosEjecutivo = {
    admin_rut_ejecutivo: document.getElementById('admin_rut_ejecutivo').value,
    admin_nombre_ejecutivo: document.getElementById('admin_nombre_ejecutivo').value,
    admin_pass_ejecutivo: document.getElementById('admin_pass_ejecutivo').value,
    admin_rol_ejecutivo: document.getElementById('admin_rol_ejecutivo').value
  };

  // Validación básica antes de enviar
  if (!datosEjecutivo.admin_rut_ejecutivo || !datosEjecutivo.admin_nombre_ejecutivo) {
    alert('Por favor completa el RUT y Nombre del ejecutivo');
    return;
  }

  try {
    const res = await fetch('https://proyecto-frontel.onrender.com/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosEjecutivo)
    });

    if (res.ok) {
      alert('¡Ejecutivo guardado con éxito en MongoDB!');
      
      // Limpia los campos del formulario
      document.getElementById('admin_rut_ejecutivo').value = '';
      document.getElementById('admin_nombre_ejecutivo').value = '';
      document.getElementById('admin_pass_ejecutivo').value = '';

      // REFRESCAR LISTA
      cargarEjecutivos();
    
    } else {
      const errorData = await res.json();
      console.error('Error desde MongoDB:', errorData);
      alert('Error al guardar en MongoDB: ' + (errorData.error || 'Verifica los campos'));
    }
  } catch (error) {
    console.error('Error de red:', error);
    alert('Error de conexión con el servidor backend');
  }
}

// Cargar la lista desde MongoDB al contenedor de la pantalla
async function cargarEjecutivos() {
  const contenedor = document.getElementById('lista-ejecutivos');
  if (!contenedor) return;

  try {
    const res = await fetch('https://proyecto-frontel.onrender.com/api/usuarios');
    const ejecutivos = await res.json();

    // Limpia el contenido actual antes de renderizar
    contenedor.innerHTML = '';

    if (!Array.isArray(ejecutivos) || ejecutivos.length === 0) {
      contenedor.innerHTML = '<p style="color: #666; text-align: center;">No hay ejecutivos registrados.</p>';
      return;
    }

    // Genera la tarjeta para cada ejecutivo encontrado en MongoDB
    ejecutivos.forEach(e => {
      const tarjeta = document.createElement('div');
      tarjeta.style.cssText = 'background: #fff; padding: 10px; margin-top: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #ddd; color: #333;';
      
      tarjeta.innerHTML = `
        <div>
          <strong style="font-size: 1.05em; color: #222;">${e.admin_nombre_ejecutivo || 'Sin nombre'}</strong> 
          <span style="color: #666; font-size: 0.85em;">(${e.admin_rol_ejecutivo || 'ejecutivo'})</span>
          <br>
          <small style="color: #777;">RUT: ${e.admin_rut_ejecutivo || 'N/A'}</small>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="editarEjecutivo('${e._id}', '${e.admin_nombre_ejecutivo}', '${e.admin_rut_ejecutivo}', '${e.admin_rol_ejecutivo}')" style="background: #626cd6; color: white; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-weight: bold;">Editar</button>
          <button onclick="eliminarEjecutivo('${e._id}')" style="background: #2929b8; color: white; border: none; padding: 3px 6px; border-radius: 4px; cursor: pointer; font-weight: bold;">Eliminar</button>
        </div>
      `;
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    console.error('Error al cargar ejecutivos:', error);
  }
}

// Función para eliminar un usuario
async function eliminarEjecutivo(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este ejecutivo?')) return;

  try {
    const res = await fetch(`https://proyecto-frontel.onrender.com/api/usuarios/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Ejecutivo eliminado correctamente');
      cargarEjecutivos();
    } else {
      alert('Error al eliminar el ejecutivo');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Función para editar los datos de un usuario
async function editarEjecutivo(id, nombreActual, rutActual, rolActual) {
  const nuevoNombre = prompt('Nuevo Nombre:', nombreActual);
  if (nuevoNombre === null) return;

  const nuevoRut = prompt('Nuevo RUT:', rutActual);
  if (nuevoRut === null) return;

  const nuevoRol = prompt('Nuevo Rol (admin / ejecutivo):', rolActual);
  if (nuevoRol === null) return;

  try {
    const res = await fetch(`https://proyecto-frontel.onrender.com/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_nombre_ejecutivo: nuevoNombre,
        admin_rut_ejecutivo: nuevoRut,
        admin_rol_ejecutivo: nuevoRol
      })
    });

    if (res.ok) {
      alert('Ejecutivo actualizado con éxito');
      cargarEjecutivos();
    } else {
      alert('Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function cerrarSesion() {
    if (confirm("¿Estás seguro de que deseas salir del sistema?")) {
        // 2. Limpiamos todos los campos de login
        document.getElementById('login_rut').value = "";
        document.getElementById('login_pass').value = "";
        
        // 3. Ocultamos las secciones privadas
        document.getElementById('seccion-admin').style.display = 'none';
        document.getElementById('seccion-atencion').style.display = 'none';
        
        // 4. Mostramos el login nuevamente
        document.getElementById('seccion-login').style.display = 'block';
        document.getElementById('titulo-sistema').innerText = "Acceso al Sistema";
        
        // 5. Opcional: mensaje de éxito
        alert("Sesión cerrada correctamente.");
    }
}

// Función extra: Permite al Admin ir a atender clientes si la oficina está llena
function volverAAtencionDesdeAdmin() {
    document.getElementById('seccion-admin').style.display = 'none';
    document.getElementById('seccion-atencion').style.display = 'block';
    volverAlModulo(); 
}

// Formulario de Atención
document.getElementById('form-atencion')?.addEventListener('submit', async (e) => {
  e.preventDefault(); // Detiene la recarga de página

  const datosAtencion = {
    rut_cliente: document.getElementById('rut_cliente').value,
    num_cliente: document.getElementById('num_cliente').value,
    cronometro: document.getElementById('cronometro').value,
    motivo_final: document.getElementById('motivo').value,
    estado_final: document.getElementById('estado').value
  };

  try {
    const res = await fetch('https://proyecto-frontel.onrender.com/api/atenciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosAtencion)
    });

    if (res.ok) {
      alert('¡Atención registrada en MongoDB!');
      e.target.reset();
    } else {
      console.error('Error al guardar:', await res.json());
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
});

document.addEventListener('DOMContentLoaded', cargarEjecutivos);