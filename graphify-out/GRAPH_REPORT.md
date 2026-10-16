# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 60 files · ~208,570 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 858 nodes · 2730 edges · 26 communities (25 shown, 1 thin omitted)
- Extraction: 67% EXTRACTED · 33% INFERRED · 0% AMBIGUOUS · INFERRED: 888 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9f88d7f2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.azar
- Generados.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- NarradorCuraServer.lua
- NarradorKnox.lua
- NarradorMundo.lua
- NarradorOcupaciones.lua
- NarradorContactos.lua
- NarradorIndicadoresCalc.lua
- NarradorLegendario.lua
- README.md
- Mundo.horas
- Mundo.nombreJugador
- Ideas futuras: campamentos de supervivientes
- envolver
- Motor.estado
- Defs.get
- Mundo.posicionActor
- NarradorConversacionServer.lua
- Motor.publicar

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 85 edges
2. `Mundo.horas()` - 85 edges
3. `Mundo.azar()` - 62 edges
4. `Mundo.log()` - 39 edges
5. `Mundo.jugadores()` - 39 edges
6. `Motor.enviar()` - 36 edges
7. `Mundo.posicion()` - 35 edges
8. `C.estado()` - 33 edges
9. `Mundo.grupoDe()` - 33 edges
10. `Motor.iniciar()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `Cal.corteLuz()` --calls--> `Mundo.hayLuz()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCalendario.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `S.residentesInfo()` --calls--> `Motor.estado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.vistaObjetivo()` --calls--> `Mundo.horas()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (26 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.13
Nodes (26): grupo(), Motor.acompanarGrupo(), Motor.avisar(), Motor.banderasDe(), Motor.banderasGrupo(), Motor.cancelar(), Motor.cantidad(), Motor.darMapaZona() (+18 more)

### Community 1 - "Mundo.azar"
Cohesion: 0.09
Nodes (53): Director.alIniciar(), Director.bajarTension(), Director.candidatos(), Director.contarRumores(), Director.elegible(), Director.estadoTexto(), Director.estilo(), Director.hablantes() (+45 more)

### Community 2 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.05
Nodes (41): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+33 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.07
Nodes (50): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+42 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (26): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.cartel(), Cliente.cuerpoDe(), Cliente.decir() (+18 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (21): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+13 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.13
Nodes (27): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+19 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorKnox.lua"
Cohesion: 0.13
Nodes (22): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), C.tonoKnox(), anotar(), avisarGrupo() (+14 more)

### Community 13 - "NarradorMundo.lua"
Cohesion: 0.06
Nodes (45): C.jugadorEnPueblo(), Director.revisarVisitas(), contarTipos(), H.dispararEco(), calza(), centro(), elegirSala(), mismasBanderas() (+37 more)

### Community 14 - "NarradorOcupaciones.lua"
Cohesion: 0.11
Nodes (36): C.curar(), C.reponer(), casillaLibre(), Mundo.cargado(), Mundo.cuerpoActor(), casillaAfuera(), clave(), O.activo() (+28 more)

### Community 15 - "NarradorContactos.lua"
Cohesion: 0.14
Nodes (26): C.alMorir(), C.anotarPuertas(), C.cajaEdificio(), C.cuerpoMuerto(), C.curarPuertas(), C.encargoActivo(), C.enterrar(), C.inmuneMurio() (+18 more)

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 18 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

### Community 20 - "Mundo.horas"
Cohesion: 0.05
Nodes (123): Cal.amigoSecreto(), Cal.brujasNoche(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla() (+115 more)

### Community 22 - "Mundo.nombreJugador"
Cohesion: 0.12
Nodes (31): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+23 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.09
Nodes (22): A. Eventos fortuitos de Eduardo (después de conocerlo), B. El camino del bandido (Knox negativo), Brújula sigue a la cámara (hecho, falta probar en el juego), C. Modo historia de los misioneros, Campamentos con niveles y comerciantes (hecho, falta probar), Detalle de lo hecho y de lo que viene, Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar) (+14 more)

### Community 25 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

### Community 26 - "Motor.estado"
Cohesion: 0.21
Nodes (18): C.revisarDesbloqueo(), Director.abrirPendientes(), Motor.actualizarPropios(), Motor.alComando(), Motor.contarBajas(), Motor.copiar(), Motor.entrar(), Motor.estado() (+10 more)

### Community 28 - "Defs.get"
Cohesion: 0.19
Nodes (19): C.encargosActivos(), C.revisarMall(), CS.responder(), Mundo.actorVivoUid(), lineasDe(), Motor.anotar(), Motor.charlar(), Motor.copiarPlano() (+11 more)

### Community 29 - "Mundo.posicionActor"
Cohesion: 0.24
Nodes (11): C.zonaSegura(), S.hablar(), Motor.charlaElegir(), Motor.decirUid(), Motor.distanciaAGrupo(), Motor.resolverTexto(), Motor.sacarDeBolsa(), Motor.tickResidentes() (+3 more)

### Community 32 - "NarradorConversacionServer.lua"
Cohesion: 0.31
Nodes (9): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.nombreDe(), S.residentesInfo(), S.rolDeOpcion() (+1 more)

### Community 36 - "Motor.publicar"
Cohesion: 0.29
Nodes (13): S.aparecer(), C.aparecer(), C.proteger(), G.revisarVecinos(), Motor.procesarPendientes(), Motor.publicar(), Motor.retirarGrupo(), Mundo.actorVivo() (+5 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `Motor.estado` to `NarradorConversacionServer.lua`, `Mundo.azar`, `NarradorMotor.lua`, `Motor.publicar`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorMundo.lua`, `NarradorOcupaciones.lua`, `NarradorContactos.lua`, `Mundo.horas`, `Mundo.nombreJugador`, `Defs.get`, `Mundo.posicionActor`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 61 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `Mundo.azar`, `Motor.publicar`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `NarradorKnox.lua`, `NarradorMundo.lua`, `NarradorOcupaciones.lua`, `NarradorContactos.lua`, `Mundo.nombreJugador`, `Motor.estado`, `Defs.get`, `Mundo.posicionActor`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.azar` be split into smaller, more focused modules?**
  _Cohesion score 0.09398496240601503 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `Mundo.horas` to `NarradorLegendario.lua`, `Mundo.posicionActor`, `NarradorKnox.lua`, `NarradorMundo.lua`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._