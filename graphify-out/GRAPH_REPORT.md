# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 54 files · ~193,579 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 776 nodes · 2417 edges · 25 communities (24 shown, 1 thin omitted)
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 740 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `479b589e`
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
- Motor.enviar
- Mundo.azar
- Mundo.posicion
- NarradorLegendario.lua
- NarradorLore.lua
- NarradorIndicadoresCalc.lua
- Cliente.recibir
- NarradorPasajeros.lua
- README.md
- Mundo.azar
- Mundo.jugadores
- NarradorObjetosServer.lua
- Ideas futuras: campamentos de supervivientes
- H.dispararEco

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 79 edges
2. `Mundo.horas()` - 74 edges
3. `Mundo.azar()` - 58 edges
4. `Mundo.log()` - 35 edges
5. `Mundo.jugadores()` - 34 edges
6. `Mundo.posicion()` - 31 edges
7. `Motor.iniciar()` - 30 edges
8. `Motor.enviar()` - 29 edges
9. `C.estado()` - 25 edges
10. `Motor.publicar()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Cal.corteLuz()` --calls--> `Mundo.hayLuz()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCalendario.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.pedirGrupo()` --calls--> `Mundo.existePerfil()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.onNpcMuerto()` --calls--> `Mundo.esJugador()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `S.casillaConPared()` --calls--> `Mundo.cargado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorObjetosServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (25 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.07
Nodes (79): C.alMorir(), C.encargosActivos(), C.enterrar(), C.inmuneMurio(), C.inmunes(), C.revisarDesbloqueo(), C.revisarMall(), listasDe() (+71 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.17
Nodes (28): Director.abrirPendientes(), Director.alIniciar(), Director.anotar(), Director.bajarTension(), Director.candidatos(), Director.elegible(), Director.estadoTexto(), Director.estilo() (+20 more)

### Community 2 - "NarradorContactos.lua"
Cohesion: 0.07
Nodes (62): C.anotarPuertas(), C.aparecer(), C.cajaEdificio(), C.cuerpoMuerto(), C.curarPuertas(), C.desbloqueado(), C.encargoActivo(), C.estado() (+54 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.05
Nodes (44): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+36 more)

### Community 5 - "NarradorDiario.lua"
Cohesion: 0.09
Nodes (45): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+37 more)

### Community 6 - "NarradorCliente.lua"
Cohesion: 0.10
Nodes (22): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+14 more)

### Community 7 - "NarradorIndicadores.lua"
Cohesion: 0.11
Nodes (23): Cliente.avisarPreguntas(), Cliente.halo(), Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.cambiarModo(), Ind.crear(), Ind.diagnostico() (+15 more)

### Community 8 - "NarradorConversas.lua"
Cohesion: 0.13
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorMundo.lua"
Cohesion: 0.08
Nodes (25): C.curar(), lejosDe(), contarTipos(), calza(), mismasBanderas(), Mundo.acompanar(), Mundo.arreglarCarnet(), Mundo.banderas() (+17 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "Motor.enviar"
Cohesion: 0.19
Nodes (20): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.dulces(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente() (+12 more)

### Community 12 - "Mundo.azar"
Cohesion: 0.20
Nodes (19): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.nivelSandbox(), E.revisarJugador(), E.tick() (+11 more)

### Community 13 - "Mundo.posicion"
Cohesion: 0.22
Nodes (18): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+10 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (8): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.marcar(), llamar()

### Community 15 - "NarradorLore.lua"
Cohesion: 0.43
Nodes (5): Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.22
Nodes (15): Ind.aPantalla(), Ind.textura(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+7 more)

### Community 17 - "Cliente.recibir"
Cohesion: 0.33
Nodes (7): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.cartel(), Cliente.decir(), Cliente.marcar(), Cliente.ponerMarcas(), Cliente.recibir()

### Community 18 - "NarradorPasajeros.lua"
Cohesion: 0.30
Nodes (13): alLado(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar(), P.esAcompanante(), P.lista(), P.mover() (+5 more)

### Community 20 - "Mundo.azar"
Cohesion: 0.11
Nodes (60): C.darMapa(), C.decir(), C.def(), C.encargoDelGrupo(), C.extra(), C.extraParaEncargo(), C.lugar(), C.nombreCompleto() (+52 more)

### Community 21 - "Mundo.jugadores"
Cohesion: 0.20
Nodes (18): jugadoresDe(), Cal.brujasNoche(), C.jugadorEnPueblo(), Director.oir(), Director.sembrar(), lugarRumor(), jugadorDe(), Motor.darMapaZona() (+10 more)

### Community 22 - "NarradorObjetosServer.lua"
Cohesion: 0.23
Nodes (13): Mundo.crearMapa(), Mundo.crearMapaZona(), S.alComando(), S.casillaConPared(), S.crearMapa(), S.favoresDisponibles(), S.pedirFavor(), S.zona() (+5 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.11
Nodes (18): Brújula sigue a la cámara (hecho, falta probar en el juego), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético, Fase 1: el campamento existe y crece, Fase 2: reservas y trueque, Fase 3: oficios, Fase 4: historia propia del campamento (+10 more)

### Community 24 - "H.dispararEco"
Cohesion: 0.31
Nodes (10): C.revisarProduccion(), H.dispararEco(), casillaLibre(), Mundo.crearItem(), Mundo.crearMapa(), Mundo.crearMapaZona(), Mundo.crearNota(), Mundo.dejarEnSuelo() (+2 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorCuraServer.lua`, `Motor.enviar`, `Mundo.azar`, `Mundo.posicion`, `NarradorPasajeros.lua`, `Mundo.azar`, `NarradorObjetosServer.lua`, `H.dispararEco`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 55 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 55 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.06884681583476764 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `Motor.enviar`, `Mundo.azar`, `Mundo.posicion`, `Mundo.azar`, `Mundo.jugadores`, `H.dispararEco`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 72 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 72 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorContactos.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.07010402532790593 - nodes in this community are weakly interconnected._
- **Why does `Mundo.azar()` connect `Mundo.azar` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `Motor.enviar`, `Mundo.posicion`, `Mundo.azar`, `Mundo.jugadores`, `H.dispararEco`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._