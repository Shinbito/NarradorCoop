# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 60 files · ~208,054 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 861 nodes · 2720 edges · 37 communities (36 shown, 1 thin omitted)
- Extraction: 68% EXTRACTED · 32% INFERRED · 0% AMBIGUOUS · INFERRED: 879 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f2747bc1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.horas
- NarradorOcupaciones.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- Mundo.jugadores
- NarradorCuraServer.lua
- NarradorKnox.lua
- NarradorCampamentos.lua
- NarradorMundo.lua
- NarradorPasajeros.lua
- NarradorContactos.lua
- NarradorIndicadoresCalc.lua
- NarradorMapas.lua
- NarradorLegendario.lua
- README.md
- NarradorContactos.lua
- Motor.enviar
- Mundo.nombreJugador
- Ideas futuras: campamentos de supervivientes
- Mundo.log
- envolver
- Motor.estado
- Mundo.azar
- Defs.get
- Mundo.posicionActor
- NarradorEncuentros.lua
- Mundo.cargado
- NarradorConversacionServer.lua
- S.comprar
- S.dia
- NarradorLore.lua
- Mundo.hayALife

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 85 edges
2. `Mundo.horas()` - 85 edges
3. `Mundo.azar()` - 62 edges
4. `Mundo.jugadores()` - 39 edges
5. `Mundo.log()` - 38 edges
6. `Motor.enviar()` - 36 edges
7. `Mundo.posicion()` - 35 edges
8. `Mundo.grupoDe()` - 33 edges
9. `C.estado()` - 32 edges
10. `Motor.iniciar()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `Cal.corteLuz()` --calls--> `Mundo.hayLuz()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCalendario.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `S.juntar()` --calls--> `K.valorMedicina()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua
- `S.juntar()` --calls--> `K.valorPrenda()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCampamentosDefs.lua
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `C.tonoKnox()` --calls--> `KD.tono()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorContactos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorKnoxDefs.lua

## Import Cycles
- None detected.

## Communities (37 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.13
Nodes (28): grupo(), Motor.acompanarGrupo(), Motor.avisar(), Motor.banderasDe(), Motor.banderasGrupo(), Motor.cantidad(), Motor.copiarPlano(), Motor.diferir() (+20 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.19
Nodes (27): Director.abrirPendientes(), Director.alIniciar(), Director.bajarTension(), Director.candidatos(), Director.elegible(), Director.estadoTexto(), Director.estilo(), Director.lanzar() (+19 more)

### Community 2 - "NarradorOcupaciones.lua"
Cohesion: 0.30
Nodes (14): clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.deMisionero(), O.estadoTexto(), O.listoParaOcupar() (+6 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.05
Nodes (46): C.elegirEncargo(), H.alTerminar(), H.completarHuella(), H.estadoTexto(), H.fama(), H.registrar(), H.st(), H.tick() (+38 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.09
Nodes (45): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+37 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (26): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.cartel(), Cliente.cuerpoDe(), Cliente.decir() (+18 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (21): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+13 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (30): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+22 more)

### Community 9 - "Mundo.jugadores"
Cohesion: 0.19
Nodes (25): Cal.dulces(), S.seguirAtaque(), C.darMapa(), C.decir(), C.extra(), C.extraParaEncargo(), C.jugadorEnPueblo(), C.pedirTrabajo() (+17 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.13
Nodes (23): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), anotar(), avisarGrupo(), KX.alMorirNpc() (+15 more)

### Community 12 - "NarradorCampamentos.lua"
Cohesion: 0.16
Nodes (27): avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), porValor(), S.aparecer(), S.aparecerGuardia() (+19 more)

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.09
Nodes (18): contarTipos(), Motor.onZombiMuerto(), mismasBanderas(), Mundo.acompanar(), Mundo.arreglarCarnet(), Mundo.banderas(), Mundo.buscarItem(), Mundo.buscarItems() (+10 more)

### Community 14 - "NarradorPasajeros.lua"
Cohesion: 0.22
Nodes (17): C.curar(), Motor.copiar(), Mundo.actorVivo(), Mundo.cuerpoActor(), alLado(), enAuto(), jugadorPorNombre(), P.agregar() (+9 more)

### Community 15 - "NarradorContactos.lua"
Cohesion: 0.15
Nodes (23): C.anotarPuertas(), C.cuerpoMuerto(), C.curarPuertas(), C.encargoActivo(), C.inmunes(), C.limpiar(), C.migrarDesbloqueo(), C.onNpcMuerto() (+15 more)

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 18 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.11
Nodes (55): S.falta(), S.nivelConfianza(), C.def(), C.encargoDelGrupo(), C.lugar(), C.nombreCompleto(), cerca(), chance() (+47 more)

### Community 21 - "Motor.enviar"
Cohesion: 0.19
Nodes (20): Cal.amigoSecreto(), Cal.brujasNoche(), Cal.calor(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+12 more)

### Community 22 - "Mundo.nombreJugador"
Cohesion: 0.20
Nodes (20): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+12 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.07
Nodes (26): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético (+18 more)

### Community 24 - "Mundo.log"
Cohesion: 0.21
Nodes (15): anotar(), S.revisar(), C.alMorir(), C.enterrar(), C.inmuneMurio(), Motor.cancelar(), Motor.entrar(), Motor.publicar() (+7 more)

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

### Community 26 - "Motor.estado"
Cohesion: 0.20
Nodes (14): C.revisarDesbloqueo(), C.revisarRegresos(), Director.anotar(), Motor.activos(), Motor.actualizarPropios(), Motor.alComando(), Motor.contarBajas(), Motor.estado() (+6 more)

### Community 27 - "Mundo.azar"
Cohesion: 0.29
Nodes (14): calza(), centro(), elegirSala(), Mundo.azar(), Mundo.buscarCercaDe(), Mundo.buscarEnPueblo(), Mundo.buscarLugar(), Mundo.describir() (+6 more)

### Community 28 - "Defs.get"
Cohesion: 0.31
Nodes (13): C.encargosActivos(), C.revisarMall(), lineasDe(), Motor.anotar(), Motor.charlar(), Motor.decir(), Motor.elegir(), Motor.opcionVisible() (+5 more)

### Community 29 - "Mundo.posicionActor"
Cohesion: 0.21
Nodes (13): S.hablar(), Director.contarRumores(), Director.hablantes(), Director.lineaPara(), Director.lineasDe(), Motor.charlaElegir(), Motor.decirUid(), Motor.distanciaAGrupo() (+5 more)

### Community 30 - "NarradorEncuentros.lua"
Cohesion: 0.30
Nodes (10): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.revisarJugador(), E.zonaDe() (+2 more)

### Community 31 - "Mundo.cargado"
Cohesion: 0.29
Nodes (12): C.cajaEdificio(), Director.revisarVisitas(), H.dispararEco(), casillaLibre(), Mundo.cargado(), Mundo.crearItem(), Mundo.crearMapa(), Mundo.crearMapaZona() (+4 more)

### Community 32 - "NarradorConversacionServer.lua"
Cohesion: 0.31
Nodes (9): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.nombreDe(), S.residentesInfo(), S.rolDeOpcion() (+1 more)

### Community 33 - "S.comprar"
Cohesion: 0.31
Nodes (9): mejorar(), S.comprar(), S.empezarAtaque(), S.forjar(), S.revisarAtaque(), S.sumarReserva(), Mundo.darItem(), Mundo.esServidor() (+1 more)

### Community 34 - "S.dia"
Cohesion: 0.31
Nodes (8): S.dia(), K.gastoDiario(), K.generarRecado(), K.normalEstacion(), K.produccionGuardias(), K.reservasIniciales(), K.valorMedicina(), K.valorPrenda()

### Community 35 - "NarradorLore.lua"
Cohesion: 0.36
Nodes (6): Motor.loreTexto(), Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 36 - "Mundo.hayALife"
Cohesion: 0.43
Nodes (7): C.aparecer(), C.reponer(), E.tick(), G.revisarVecinos(), Mundo.hayALife(), Mundo.reservarNombres(), Mundo.spawnGrupo()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `Motor.estado` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorOcupaciones.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `Mundo.jugadores`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorCampamentos.lua`, `NarradorPasajeros.lua`, `NarradorContactos.lua`, `NarradorContactos.lua`, `Motor.enviar`, `Mundo.nombreJugador`, `Mundo.log`, `Defs.get`, `Mundo.posicionActor`, `NarradorEncuentros.lua`, `Mundo.cargado`, `NarradorConversacionServer.lua`, `Mundo.hayALife`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorOcupaciones.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `Mundo.jugadores`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorCampamentos.lua`, `NarradorMundo.lua`, `NarradorContactos.lua`, `Motor.enviar`, `Mundo.nombreJugador`, `Mundo.log`, `Motor.estado`, `Defs.get`, `Mundo.posicionActor`, `NarradorEncuentros.lua`, `Mundo.cargado`, `S.comprar`, `S.dia`, `Mundo.hayALife`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorConversacion.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.07243243243243243 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `S.comprar` to `Mundo.jugadores`, `NarradorKnox.lua`, `NarradorCampamentos.lua`, `NarradorLegendario.lua`, `NarradorContactos.lua`, `Motor.enviar`, `Mundo.posicionActor`, `Mundo.cargado`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._