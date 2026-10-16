# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 50 files · ~181,428 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 732 nodes · 2256 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 674 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aaa59f32`
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
- NarradorCalendario.lua
- NarradorOcupaciones.lua
- NarradorLegendario.lua
- NarradorIndicadoresCalc.lua
- NarradorLore.lua
- README.md
- Ideas futuras: campamentos de supervivientes
- envolver

## God Nodes (most connected - your core abstractions)
1. `Mundo.horas()` - 72 edges
2. `Motor.estado()` - 70 edges
3. `Mundo.azar()` - 56 edges
4. `Mundo.jugadores()` - 31 edges
5. `Mundo.log()` - 29 edges
6. `Motor.iniciar()` - 28 edges
7. `Mundo.posicion()` - 27 edges
8. `Motor.enviar()` - 26 edges
9. `Motor.publicar()` - 25 edges
10. `Mundo.grupoDe()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Cal.corteLuz()` --calls--> `Mundo.hayLuz()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCalendario.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.onNpcMuerto()` --calls--> `Mundo.esJugador()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.elegir()` --calls--> `Mundo.tieneEtiqueta()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (19 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.07
Nodes (84): C.encargosActivos(), C.revisarMall(), C.vigilar(), listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase() (+76 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.11
Nodes (45): Director.abrirPendientes(), Director.alIniciar(), Director.anotar(), Director.bajarTension(), Director.candidatos(), Director.contarRumores(), Director.elegible(), Director.estadoTexto() (+37 more)

### Community 2 - "NarradorContactos.lua"
Cohesion: 0.08
Nodes (74): Cal.ultimaNoche(), C.alMorir(), C.darMapa(), C.decir(), C.def(), C.elegirEncargo(), C.encargoActivo(), C.encargoDelGrupo() (+66 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.05
Nodes (44): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+36 more)

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
Cohesion: 0.07
Nodes (57): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+49 more)

### Community 9 - "NarradorMundo.lua"
Cohesion: 0.05
Nodes (60): C.cuerpoMuerto(), C.curar(), E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano() (+52 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorCalendario.lua"
Cohesion: 0.19
Nodes (18): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+10 more)

### Community 12 - "NarradorOcupaciones.lua"
Cohesion: 0.16
Nodes (25): C.aparecer(), C.reponer(), E.tick(), G.revisarVecinos(), Mundo.cargado(), Mundo.hayALife(), Mundo.reservarNombres(), Mundo.spawnGrupo() (+17 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (8): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.marcar(), llamar()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorLore.lua"
Cohesion: 0.43
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

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

- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.06945863125638406 - nodes in this community are weakly interconnected._
- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 46 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.10815602836879433 - nodes in this community are weakly interconnected._
- **Why does `Mundo.azar()` connect `NarradorMundo.lua` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorContactos.lua`, `NarradorConversas.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._