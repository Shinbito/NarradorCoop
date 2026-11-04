# Graph Report - NarradorCoop  (2026-11-04)

## Corpus Check
- 112 files · ~548,421 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: .X 19, (none) 1, .jar 1)

## Summary
- 1245 nodes · 3856 edges · 51 communities (44 shown, 7 thin omitted)
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 1331 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ce3f0c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorDirector.lua
- NarradorContactos.lua
- NarradorMundo.lua
- NarradorConversacion.lua
- NarradorMundo.lua
- NarradorDiario.lua
- NarradorCampamentos.lua
- NarradorKnox.lua
- NarradorConversas.lua
- NarradorDominios.lua
- NarradorCliente.lua
- NarradorBandido.lua
- NarradorIndicadores.lua
- NarradorIndicadoresCalc.lua
- Motor.publicar
- NarradorOcupaciones.lua
- NarradorVidas.lua
- NarradorLore.lua
- Ind.menu
- NarradorContactos.lua
- NarradorLegendario.lua
- Generados.lua
- S.pedirFavor
- Motor.estado
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua
- README.md
- Mundo.posicion
- NarradorMundoALife.lua
- Mundo.jugadores
- NarradorPasajeros.lua
- NarradorMotor.lua
- NarradorViewpoint
- Mundo.hayALife
- Motor.estado
- NarradorMotorGrupos.lua
- NarradorOcupaciones.lua
- Mundo.jugadorCerca
- NarradorConversacionServer.lua
- Motor.procesarPendientes
- HistoriasSous2.lua
- Capitulos.lua
- HistoriasSous1.lua
- NarradorRepararCliente.lua
- ED.tick
- NarradorHuellas.lua
- Hollis.lua
- Mundo.log
- NarradorSousConfianza.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 150 edges
2. `Mundo.horas()` - 112 edges
3. `Mundo.azar()` - 75 edges
4. `Mundo.log()` - 69 edges
5. `Mundo.jugadores()` - 49 edges
6. `Motor.enviar()` - 48 edges
7. `Mundo.jugadorCerca()` - 41 edges
8. `Motor.publicar()` - 40 edges
9. `Mundo.grupoDe()` - 40 edges
10. `Mundo.cargado()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `Cal.corteLuz()` --calls--> `Mundo.hayLuz()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCalendario.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCampamentos.lua → 42/media/lua/shared/Narrador/NarradorLegendario.lua
- `CO.estanque()` --calls--> `Mundo.llenarBencina()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConsecuencias.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `C.enterrar()` --calls--> `Mundo.quitarCadaver()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `S.residentesInfo()` --calls--> `Motor.estado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConversacionServer.lua → 42/media/lua/server/Narrador/NarradorMotor.lua

## Import Cycles
- None detected.

## Communities (51 total, 7 thin omitted)

### Community 0 - "NarradorDirector.lua"
Cohesion: 0.14
Nodes (35): Director.abrirPendientes(), Director.activos(), Director.alIniciar(), Director.anotar(), Director.bajarTension(), Director.candidatos(), Director.casillaEnSala(), Director.cuentaEnCupo() (+27 more)

### Community 1 - "NarradorContactos.lua"
Cohesion: 0.08
Nodes (75): BA.consecuenciaLena(), S.nivelConfianza(), CO.estanque(), C.darMapa(), C.decir(), C.def(), C.distancia(), C.encargoDelGrupo() (+67 more)

### Community 2 - "NarradorMundo.lua"
Cohesion: 0.05
Nodes (57): S.forjar(), C.armaKit(), contarTipos(), H.crearArma(), H.crearArmas(), H.crearArma(), calza(), centro() (+49 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.06
Nodes (71): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+63 more)

### Community 4 - "NarradorMundo.lua"
Cohesion: 0.10
Nodes (26): Cura.examinar(), Cura.menuInventario(), Cura.pedirPruebaAgua(), Cura.resultadoAgua(), nivelMedicina(), tooltip(), CS.falta(), CS.pruebaAgua() (+18 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.07
Nodes (69): agregar(), capitulosCerrados(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion() (+61 more)

### Community 6 - "NarradorCampamentos.lua"
Cohesion: 0.08
Nodes (58): anotar(), avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor() (+50 more)

### Community 7 - "NarradorKnox.lua"
Cohesion: 0.07
Nodes (28): C.tonoKnox(), H.gruposDe(), anotar(), avisarGrupo(), gruposDe(), KX.alMorirNpc(), KX.bandidosLimpios(), KX.despreciado() (+20 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.11
Nodes (27): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+19 more)

### Community 9 - "NarradorDominios.lua"
Cohesion: 0.09
Nodes (29): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), CA.anotar(), CA.anotarContacto(), CA.revisar() (+21 more)

### Community 10 - "NarradorCliente.lua"
Cohesion: 0.09
Nodes (23): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.enviar(), Cliente.esAdmin(), Cliente.menu() (+15 more)

### Community 11 - "NarradorBandido.lua"
Cohesion: 0.23
Nodes (15): BA.alTerminar(), BA.consecuenciaUltimo(), BA.enCurso(), BA.esDelBandido(), BA.jefe(), BA.jefeCorto(), BA.lanzar(), BA.revisar() (+7 more)

### Community 12 - "NarradorIndicadores.lua"
Cohesion: 0.13
Nodes (17): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+9 more)

### Community 14 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.18
Nodes (17): Ind.aPantalla(), Ind.objetivos(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso() (+9 more)

### Community 15 - "Motor.publicar"
Cohesion: 0.19
Nodes (18): C.encargosActivos(), C.revisarMall(), CS.responder(), CS.terminar(), CS.anotarPrueba(), Motor.anotar(), Motor.distanciaAGrupo(), Motor.elegir() (+10 more)

### Community 16 - "NarradorOcupaciones.lua"
Cohesion: 0.12
Nodes (23): apiSimbolos(), datosDe(), fuenteTexto(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu() (+15 more)

### Community 17 - "NarradorVidas.lua"
Cohesion: 0.17
Nodes (17): bloqueada(), contiene(), etapasDe(), indexar(), mayus(), sacar(), V.armar(), V.calza() (+9 more)

### Community 18 - "NarradorLore.lua"
Cohesion: 0.17
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Ind.menu"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.13
Nodes (21): abierta(), C.anotarPuertas(), C.cajaEdificio(), C.curarPuertas(), C.encargoActivo(), C.migrarDesbloqueo(), C.onNpcMuerto(), C.recorrerEdificio() (+13 more)

### Community 21 - "NarradorLegendario.lua"
Cohesion: 0.19
Nodes (17): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+9 more)

### Community 22 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 23 - "S.pedirFavor"
Cohesion: 0.13
Nodes (29): adentro(), alturaMesa(), anillos(), cabeMesa(), clave(), edificio(), esGrupoBase(), esSuelo() (+21 more)

### Community 24 - "Motor.estado"
Cohesion: 0.18
Nodes (16): B.migrar(), C.revisarDesbloqueo(), C.revisarRegresos(), H.disponible(), H.ocupado(), H.revisar(), Motor.activos(), Motor.historiaAbierta() (+8 more)

### Community 25 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous.lua"
Cohesion: 0.28
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "NarradorObjetos.lua"
Cohesion: 0.38
Nodes (5): C.elegirEncargo(), Defs.todos(), anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 28 - "README.md"
Cohesion: 0.19
Nodes (20): avisarCerca(), avisarTodos(), B.alVolver(), B.aparecer(), B.hornear(), B.huir(), B.limpiarCasa(), B.peligro() (+12 more)

### Community 29 - "Mundo.posicion"
Cohesion: 0.19
Nodes (23): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+15 more)

### Community 30 - "NarradorMundoALife.lua"
Cohesion: 0.14
Nodes (17): C.aparecer(), C.reponer(), Motor.actualizarPropios(), Mundo.esJugador(), mismasBanderas(), Mundo.acompanar(), Mundo.arreglarCarnet(), Mundo.asesinoALife() (+9 more)

### Community 31 - "Mundo.jugadores"
Cohesion: 0.43
Nodes (8): jugadoresDe(), jugadorConGancho(), C.jugadorEnPueblo(), C.jugadoresDelGrupo(), jugadorDe(), Motor.darMapaZona(), Mundo.jugadores(), Mundo.vivo()

### Community 32 - "NarradorPasajeros.lua"
Cohesion: 0.18
Nodes (22): Mundo.actorVivo(), alLado(), cercaDe(), enAuto(), jugadorPorNombre(), P.bajar(), P.banderasPropias(), P.banderasSolo() (+14 more)

### Community 33 - "NarradorMotor.lua"
Cohesion: 0.13
Nodes (19): hayContadorDeBajas(), Motor.avisar(), Motor.avisarContador(), Motor.cantidad(), Motor.contarBajas(), Motor.decir(), Motor.migrar(), Motor.migrarEduardo() (+11 more)

### Community 35 - "Mundo.hayALife"
Cohesion: 0.22
Nodes (8): BA.tick(), EV.puede(), EV.revisar(), EV.tick(), E.tick(), H.tick(), Mundo.hayALife(), VM.tick()

### Community 36 - "Motor.estado"
Cohesion: 0.22
Nodes (15): C.inmuneMurio(), C.inmunes(), C.tickMinuto(), H.haySousActiva(), H.siguiente(), H.tick(), H.ultimoInicioSous(), Motor.alComando() (+7 more)

### Community 37 - "NarradorMotorGrupos.lua"
Cohesion: 0.24
Nodes (16): Motor.copiar(), Motor.diferir(), Motor.acompanarGrupo(), Motor.banderasDe(), Motor.banderasGrupo(), Motor.completarGrupo(), Motor.corregirNombres(), Motor.filtrarPerfiles() (+8 more)

### Community 38 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 39 - "Mundo.jugadorCerca"
Cohesion: 0.14
Nodes (20): C.cuerpoMuerto(), C.cuerpoRoto(), C.curar(), C.limpiar(), C.npcEnPuesto(), C.reponerUnaVez(), C.vigilar(), C.zonaSegura() (+12 more)

### Community 40 - "NarradorConversacionServer.lua"
Cohesion: 0.29
Nodes (10): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.hablar(), S.nombreDe(), S.residentesInfo() (+2 more)

### Community 41 - "Motor.procesarPendientes"
Cohesion: 0.36
Nodes (7): Motor.procesarPendientes(), Motor.copiarPlano(), Motor.ejecutar(), Motor.lugarDe(), Motor.resolverVars(), Motor.retirarGrupo(), Motor.tamanoHorda()

### Community 46 - "ED.tick"
Cohesion: 0.24
Nodes (15): ED.aparecer(), ED.corresponde(), ED.enHistoria(), ED.sigueme(), ED.st(), ED.tick(), ED.vuelve(), Motor.vacia() (+7 more)

### Community 47 - "NarradorHuellas.lua"
Cohesion: 0.33
Nodes (11): H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.dispararEco(), H.estadoTexto(), H.fama(), H.registrar(), H.st() (+3 more)

### Community 49 - "Mundo.log"
Cohesion: 0.29
Nodes (8): C.alMorir(), C.enterrar(), CS.repasoCura(), Motor.tick(), Mundo.log(), P.agregar(), SB.amueblar(), SB.memoria()

### Community 50 - "NarradorSousConfianza.lua"
Cohesion: 0.46
Nodes (7): SC.integrante(), SC.reclutable(), SC.sigueme(), SC.sumarConectados(), SC.tabla(), SC.valor(), SC.vuelve()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `Motor.estado` to `NarradorDirector.lua`, `NarradorContactos.lua`, `NarradorMundo.lua`, `NarradorMundo.lua`, `NarradorCampamentos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorBandido.lua`, `Motor.publicar`, `NarradorOcupaciones.lua`, `NarradorContactos.lua`, `NarradorLegendario.lua`, `S.pedirFavor`, `Motor.estado`, `README.md`, `Mundo.posicion`, `NarradorMundoALife.lua`, `NarradorPasajeros.lua`, `NarradorMotor.lua`, `Mundo.hayALife`, `NarradorMotorGrupos.lua`, `NarradorOcupaciones.lua`, `Mundo.jugadorCerca`, `NarradorConversacionServer.lua`, `Motor.procesarPendientes`, `ED.tick`, `NarradorHuellas.lua`, `Mundo.log`, `NarradorSousConfianza.lua`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Are the 130 inferred relationships involving `Motor.estado()` (e.g. with `A.programar()` and `A.st()`) actually correct?**
  _`Motor.estado()` has 130 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorDirector.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.13513513513513514 - nodes in this community are weakly interconnected._
- **Why does `Defs.get()` connect `Motor.estado` to `NarradorDirector.lua`, `NarradorContactos.lua`, `NarradorMotor.lua`, `Motor.estado`, `NarradorCampamentos.lua`, `NarradorConversacionServer.lua`, `NarradorDefs.lua`, `ED.tick`, `Motor.publicar`, `NarradorHuellas.lua`, `Hollis.lua`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 111 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 111 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorContactos.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.0824074074074074 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `NarradorDirector.lua` to `NarradorContactos.lua`, `NarradorMundo.lua`, `NarradorMundo.lua`, `NarradorCampamentos.lua`, `NarradorKnox.lua`, `NarradorConversas.lua`, `NarradorDominios.lua`, `NarradorBandido.lua`, `Motor.publicar`, `NarradorLegendario.lua`, `S.pedirFavor`, `Motor.estado`, `README.md`, `Mundo.posicion`, `NarradorMundoALife.lua`, `NarradorMotor.lua`, `Mundo.hayALife`, `Motor.estado`, `NarradorMotorGrupos.lua`, `NarradorOcupaciones.lua`, `Mundo.jugadorCerca`, `Motor.procesarPendientes`, `ED.tick`, `NarradorHuellas.lua`, `Mundo.log`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._