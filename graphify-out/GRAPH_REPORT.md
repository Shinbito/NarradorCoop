# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 50 files · ~182,098 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 741 nodes · 2282 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 680 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `77a5509a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.horas
- NarradorContactos.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- NarradorMundo.lua
- NarradorCuraServer.lua
- NarradorEncuentros.lua
- NarradorContactos.lua
- Generados.lua
- NarradorLegendario.lua
- NarradorIndicadoresCalc.lua
- README.md
- Ideas futuras: campamentos de supervivientes
- envolver

## God Nodes (most connected - your core abstractions)
1. `Mundo.horas()` - 72 edges
2. `Motor.estado()` - 70 edges
3. `Mundo.azar()` - 56 edges
4. `Mundo.jugadores()` - 31 edges
5. `Mundo.log()` - 30 edges
6. `Motor.iniciar()` - 28 edges
7. `Mundo.posicion()` - 27 edges
8. `Motor.enviar()` - 26 edges
9. `Motor.publicar()` - 25 edges
10. `Mundo.grupoDe()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `CS.repasoCura()` --calls--> `Cura.infectado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCuraServer.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCura.lua
- `Motor.vistaObjetivo()` --calls--> `Mundo.horas()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `S.casillaConPared()` --calls--> `Mundo.cargado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorObjetosServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Conv.abrir()` --calls--> `Cliente.enviar()`  [INFERRED]
  NarradorCoop/42/media/lua/client/Narrador/NarradorConversacion.lua → NarradorCoop/42/media/lua/client/Narrador/NarradorCliente.lua

## Import Cycles
- None detected.

## Communities (19 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.05
Nodes (90): C.encargosActivos(), C.revisarMall(), listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.hablar() (+82 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.06
Nodes (102): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+94 more)

### Community 2 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (88): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+80 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.06
Nodes (35): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+27 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.09
Nodes (44): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+36 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (26): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.cartel(), Cliente.cuerpoDe(), Cliente.decir() (+18 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.12
Nodes (21): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+13 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.12
Nodes (30): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+22 more)

### Community 9 - "NarradorMundo.lua"
Cohesion: 0.08
Nodes (36): C.curar(), contarTipos(), calza(), centro(), elegirSala(), mismasBanderas(), Mundo.arreglarCarnet(), Mundo.banderas() (+28 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (13): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), Cura.curar(), Cura.dolor() (+5 more)

### Community 11 - "NarradorEncuentros.lua"
Cohesion: 0.27
Nodes (11): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.nivelSandbox(), E.revisarJugador() (+3 more)

### Community 12 - "NarradorContactos.lua"
Cohesion: 0.15
Nodes (20): C.anotarPuertas(), C.cajaEdificio(), C.cuerpoMuerto(), C.curarPuertas(), C.encargoActivo(), C.extraParaEncargo(), C.limpiar(), C.onNpcMuerto() (+12 more)

### Community 13 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (8): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.marcar(), llamar()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.15
Nodes (12): Brújula sigue a la cámara (hecho, falta probar en el juego), Diario en lápiz pasta azul (hecho, falta probar en el juego), Estético, Fase 1: el campamento existe y crece, Fase 2: reservas y trueque, Fase 3: oficios, Fase 4: historia propia del campamento, Ideas futuras: campamentos de supervivientes (+4 more)

### Community 29 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorEncuentros.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.050505050505050504 - nodes in this community are weakly interconnected._
- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `NarradorEncuentros.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 46 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.06001796945193172 - nodes in this community are weakly interconnected._
- **Why does `Mundo.azar()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorEncuentros.lua`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._