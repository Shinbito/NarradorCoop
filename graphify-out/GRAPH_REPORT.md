# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 49 files · ~179,715 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: .X 18, .info 1)

## Summary
- 709 nodes · 2220 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 673 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d86acfe4`
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
- H.dispararEco
- NarradorLegendario.lua
- Mundo.buscarLugar
- NarradorObjetosServer.lua
- NarradorLore.lua
- Mundo.cuerpoActor
- README.md

## God Nodes (most connected - your core abstractions)
1. `Mundo.horas()` - 72 edges
2. `Motor.estado()` - 70 edges
3. `Mundo.azar()` - 56 edges
4. `Mundo.jugadores()` - 31 edges
5. `Mundo.log()` - 29 edges
6. `Motor.enviar()` - 28 edges
7. `Motor.iniciar()` - 28 edges
8. `Mundo.posicion()` - 27 edges
9. `Motor.publicar()` - 25 edges
10. `Mundo.grupoDe()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.onNpcMuerto()` --calls--> `Mundo.esJugador()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.elegir()` --calls--> `Mundo.tieneEtiqueta()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `S.casillaConPared()` --calls--> `Mundo.cargado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorObjetosServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.06
Nodes (100): C.aparecer(), C.encargoActivo(), C.encargosActivos(), C.revisarMall(), C.tick(), C.zonaSegura(), listasDe(), S.alComando() (+92 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.07
Nodes (75): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+67 more)

### Community 2 - "NarradorContactos.lua"
Cohesion: 0.09
Nodes (71): Cal.dulces(), Cal.ultimaNoche(), C.alMorir(), C.darMapa(), C.decir(), C.def(), C.encargoDelGrupo(), C.enterrar() (+63 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.06
Nodes (41): datosDe(), imagenEncima(), M.iniciarMapa(), M.menu(), M.pedirFavor(), M.ponerMarcas(), C.elegirEncargo(), H.alTerminar() (+33 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.09
Nodes (44): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+36 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.08
Nodes (31): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.alIniciar(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.cuerpoDe() (+23 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.09
Nodes (32): Ind.actualizarPaneles(), Ind.alTick(), Ind.aPantalla(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.guardar(), Ind.hayViewpoint() (+24 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.13
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorMundo.lua"
Cohesion: 0.09
Nodes (19): contarTipos(), Mundo.acompanar(), Mundo.actorVivo(), Mundo.buscarItem(), Mundo.buscarItems(), Mundo.claveALife(), Mundo.esAdmin(), Mundo.esComida() (+11 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorCalendario.lua"
Cohesion: 0.20
Nodes (16): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente(), Cal.sousAliados() (+8 more)

### Community 12 - "NarradorOcupaciones.lua"
Cohesion: 0.28
Nodes (15): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.decorar(), O.estadoTexto(), O.grafitear() (+7 more)

### Community 13 - "H.dispararEco"
Cohesion: 0.33
Nodes (11): Director.revisarVisitas(), H.dispararEco(), casillaLibre(), Mundo.cargado(), Mundo.crearItem(), Mundo.crearMapa(), Mundo.crearMapaZona(), Mundo.crearNota() (+3 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (8): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.marcar(), llamar()

### Community 15 - "Mundo.buscarLugar"
Cohesion: 0.36
Nodes (10): calza(), centro(), elegirSala(), Mundo.buscarCercaDe(), Mundo.buscarEnPueblo(), Mundo.buscarLugar(), Mundo.describir(), Mundo.elegirAgrupada() (+2 more)

### Community 16 - "NarradorObjetosServer.lua"
Cohesion: 0.36
Nodes (6): Mundo.crearMapa(), Mundo.crearMapaZona(), S.alComando(), S.casillaConPared(), S.crearMapa(), S.zona()

### Community 17 - "NarradorLore.lua"
Cohesion: 0.43
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 18 - "Mundo.cuerpoActor"
Cohesion: 0.29
Nodes (7): C.curar(), mismasBanderas(), Mundo.arreglarCarnet(), Mundo.banderas(), Mundo.cuerpoActor(), O.darBotin(), O.tipo()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`, `H.dispararEco`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.05822102425876011 - nodes in this community are weakly interconnected._
- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`, `H.dispararEco`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 46 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.07373417721518988 - nodes in this community are weakly interconnected._
- **Why does `Mundo.azar()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`, `H.dispararEco`, `Mundo.buscarLugar`, `Mundo.cuerpoActor`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._