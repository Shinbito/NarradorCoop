# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 50 files · ~181,214 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 730 nodes · 2257 edges · 30 communities (29 shown, 1 thin omitted)
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 678 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22709184`
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
- Motor.elegir
- NarradorLegendario.lua
- Mundo.azar
- NarradorIndicadoresCalc.lua
- NarradorLore.lua
- G.revisarVecinos
- README.md
- Mundo.sandbox
- Motor.estado
- NarradorEncuentros.lua
- Ideas futuras: campamentos de supervivientes
- Mundo.posicionActor
- NarradorConversacionServer.lua
- Generados.lua
- S.pedirFavor
- Motor.procesarPendientes
- envolver

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
- `S.residentesInfo()` --calls--> `Motor.estado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `S.casillaConPared()` --calls--> `Mundo.cargado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorObjetosServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Conv.abrir()` --calls--> `Cliente.enviar()`  [INFERRED]
  NarradorCoop/42/media/lua/client/Narrador/NarradorConversacion.lua → NarradorCoop/42/media/lua/client/Narrador/NarradorCliente.lua
- `NarradorConversacionVentana:elegirOpcion()` --calls--> `Cliente.enviar()`  [INFERRED]
  NarradorCoop/42/media/lua/client/Narrador/NarradorConversacion.lua → NarradorCoop/42/media/lua/client/Narrador/NarradorCliente.lua

## Import Cycles
- None detected.

## Communities (30 total, 1 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.13
Nodes (25): Motor.acompanarGrupo(), Motor.avisar(), Motor.banderasDe(), Motor.banderasGrupo(), Motor.cantidad(), Motor.contarBajas(), Motor.copiar(), Motor.copiarPlano() (+17 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.12
Nodes (39): C.alMorir(), C.aparecer(), C.curar(), C.enterrar(), C.reponer(), Director.abrirPendientes(), Director.alIniciar(), Director.anotar() (+31 more)

### Community 2 - "NarradorContactos.lua"
Cohesion: 0.08
Nodes (80): Cal.calor(), Cal.dulces(), Cal.niebla(), Cal.st(), Cal.ultimaNoche(), C.cuerpoMuerto(), C.darMapa(), C.decir() (+72 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (67): ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir(), Conv.crearRastreador() (+59 more)

### Community 4 - "NarradorDefs.lua"
Cohesion: 0.06
Nodes (36): datosDe(), imagenEncima(), M.iniciarMapa(), M.menu(), M.pedirFavor(), M.ponerMarcas(), H.alTerminar(), H.anunciarTitulo() (+28 more)

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
Cohesion: 0.13
Nodes (29): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+21 more)

### Community 9 - "NarradorMundo.lua"
Cohesion: 0.11
Nodes (26): contarTipos(), H.dispararEco(), calza(), casillaLibre(), centro(), Mundo.buscarCercaDe(), Mundo.buscarEnPueblo(), Mundo.buscarItems() (+18 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (14): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.repasoCura(), CS.st(), CS.vista(), Cura.curar() (+6 more)

### Community 11 - "NarradorCalendario.lua"
Cohesion: 0.24
Nodes (12): Cal.amigoSecreto(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.residente(), Cal.sousAliados(), Cal.tick(), Cal.una() (+4 more)

### Community 12 - "NarradorOcupaciones.lua"
Cohesion: 0.23
Nodes (18): Mundo.cargado(), casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar() (+10 more)

### Community 13 - "Motor.elegir"
Cohesion: 0.18
Nodes (19): C.encargosActivos(), lineasDe(), Motor.anotar(), Motor.charlar(), Motor.cumple(), Motor.decir(), Motor.distanciaAGrupo(), Motor.elegir() (+11 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (8): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.marcar(), llamar()

### Community 15 - "Mundo.azar"
Cohesion: 0.23
Nodes (22): A.lanzar(), centro(), jugadoresDe(), Cal.brujasNoche(), Cal.tormenta(), Director.sembrar(), lugarRumor(), E.tick() (+14 more)

### Community 16 - "NarradorIndicadoresCalc.lua"
Cohesion: 0.20
Nodes (16): Ind.aPantalla(), Ind.objetivos(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color() (+8 more)

### Community 17 - "NarradorLore.lua"
Cohesion: 0.27
Nodes (8): Motor.loreTexto(), Motor.tipoDe(), Motor.vistaHistorial(), Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 18 - "G.revisarVecinos"
Cohesion: 0.20
Nodes (11): G.revisarVecinos(), mismasBanderas(), Mundo.acompanar(), Mundo.arreglarCarnet(), Mundo.banderas(), Mundo.claveALife(), Mundo.cuerpoActor(), Mundo.instalarNombres() (+3 more)

### Community 20 - "Mundo.sandbox"
Cohesion: 0.25
Nodes (15): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.presupuesto(), A.programar(), A.st() (+7 more)

### Community 21 - "Motor.estado"
Cohesion: 0.27
Nodes (15): Motor.actualizarPropios(), Motor.alComando(), Motor.cancelar(), Motor.entrar(), Motor.estado(), Motor.forzarEtapa(), Motor.infoAdmin(), Motor.iniciar() (+7 more)

### Community 22 - "NarradorEncuentros.lua"
Cohesion: 0.28
Nodes (11): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.nivelSandbox(), E.revisarJugador() (+3 more)

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.15
Nodes (12): Brújula sigue a la cámara (hecho, falta probar en el juego), Diario en lápiz pasta azul (hecho, falta probar en el juego), Estético, Fase 1: el campamento existe y crece, Fase 2: reservas y trueque, Fase 3: oficios, Fase 4: historia propia del campamento, Ideas futuras: campamentos de supervivientes (+4 more)

### Community 24 - "Mundo.posicionActor"
Cohesion: 0.23
Nodes (12): C.limpiar(), C.zonaSegura(), S.hablar(), Motor.charlaElegir(), Motor.decirUid(), Motor.resolverTexto(), Motor.sacarDeBolsa(), Motor.tickResidentes() (+4 more)

### Community 25 - "NarradorConversacionServer.lua"
Cohesion: 0.31
Nodes (9): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.nombreDe(), S.residentesInfo(), S.rolDeOpcion() (+1 more)

### Community 26 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 27 - "S.pedirFavor"
Cohesion: 0.50
Nodes (7): S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 28 - "Motor.procesarPendientes"
Cohesion: 0.47
Nodes (6): grupo(), Motor.procesarPendientes(), Motor.retirarGrupo(), Motor.transformar(), Mundo.retirar(), Mundo.zombiEn()

### Community 29 - "envolver"
Cohesion: 0.40
Nodes (5): envolver(), NarradorMensaje:mostrar(), NarradorTexto:limitarScroll(), NarradorTexto:onMouseWheel(), NarradorTexto:setBloques()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`, `Motor.elegir`, `Mundo.azar`, `G.revisarVecinos`, `Mundo.sandbox`, `Motor.estado`, `NarradorEncuentros.lua`, `Mundo.posicionActor`, `Motor.procesarPendientes`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.12807881773399016 - nodes in this community are weakly interconnected._
- **Why does `Motor.estado()` connect `Motor.estado` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorContactos.lua`, `NarradorDefs.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`, `Motor.elegir`, `NarradorLore.lua`, `G.revisarVecinos`, `Mundo.sandbox`, `NarradorEncuentros.lua`, `Mundo.posicionActor`, `NarradorConversacionServer.lua`, `S.pedirFavor`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 46 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.12073170731707317 - nodes in this community are weakly interconnected._
- **Why does `Mundo.azar()` connect `Mundo.azar` to `NarradorMotor.lua`, `Mundo.horas`, `NarradorContactos.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCalendario.lua`, `NarradorOcupaciones.lua`, `Mundo.sandbox`, `NarradorEncuentros.lua`, `Mundo.posicionActor`, `NarradorConversacionServer.lua`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._