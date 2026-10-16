# Graph Report - NarradorCoop  (2026-10-16)

## Corpus Check
- 57 files · ~196,750 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 20 file(s) not represented in the graph (top: .X 18, (none) 1, .info 1)

## Summary
- 800 nodes · 2503 edges · 27 communities (25 shown, 2 thin omitted)
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 781 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ea0efac7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- NarradorMotor.lua
- Mundo.horas
- NarradorMapas.lua
- NarradorConversacion.lua
- NarradorDefs.lua
- NarradorDiario.lua
- NarradorCliente.lua
- NarradorIndicadores.lua
- NarradorConversas.lua
- NarradorMundo.lua
- NarradorCuraServer.lua
- Motor.enviar
- NarradorHuellas.lua
- Generados.lua
- NarradorLegendario.lua
- NarradorLore.lua
- NarradorIndicadoresCalc.lua
- Cliente.recibir
- NarradorPasajeros.lua
- README.md
- NarradorContactos.lua
- NarradorObjetosServer.lua
- NarradorObjetosServer.lua
- Ideas futuras: campamentos de supervivientes
- Contratos.lua
- Sous.lua
- NarradorObjetos.lua

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 80 edges
2. `Mundo.horas()` - 76 edges
3. `Mundo.azar()` - 58 edges
4. `Mundo.log()` - 36 edges
5. `Mundo.jugadores()` - 34 edges
6. `Mundo.posicion()` - 31 edges
7. `Motor.enviar()` - 30 edges
8. `Motor.iniciar()` - 30 edges
9. `C.estado()` - 28 edges
10. `Motor.publicar()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `S.comprar()` --calls--> `L.crearAuto()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCampamentos.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorLegendario.lua
- `S.alComando()` --calls--> `Mundo.log()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorConversacionServer.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `CS.repasoCura()` --calls--> `Cura.infectado()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorCuraServer.lua → NarradorCoop/42/media/lua/shared/Narrador/NarradorCura.lua
- `Motor.vistaObjetivo()` --calls--> `Mundo.horas()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua
- `Motor.transformar()` --calls--> `Mundo.zombiEn()`  [INFERRED]
  NarradorCoop/42/media/lua/server/Narrador/NarradorMotor.lua → NarradorCoop/42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (27 total, 2 thin omitted)

### Community 0 - "NarradorMotor.lua"
Cohesion: 0.07
Nodes (80): C.encargosActivos(), C.revisarMall(), listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.hablar() (+72 more)

### Community 1 - "Mundo.horas"
Cohesion: 0.06
Nodes (104): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+96 more)

### Community 2 - "NarradorMapas.lua"
Cohesion: 0.26
Nodes (9): apiSimbolos(), datosDe(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu(), M.pedirFavor() (+1 more)

### Community 3 - "NarradorConversacion.lua"
Cohesion: 0.07
Nodes (68): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+60 more)

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
Cohesion: 0.07
Nodes (42): E.activo(), E.direccion(), E.elegirTipo(), E.estado(), E.lanzar(), E.misioneroCercano(), E.nivelSandbox(), E.revisarJugador() (+34 more)

### Community 10 - "NarradorCuraServer.lua"
Cohesion: 0.17
Nodes (13): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), Cura.curar(), Cura.dolor() (+5 more)

### Community 11 - "Motor.enviar"
Cohesion: 0.23
Nodes (13): Cal.amigoSecreto(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.residente(), Cal.sousAliados(), Cal.tick(), Cal.ultimaNoche() (+5 more)

### Community 12 - "NarradorHuellas.lua"
Cohesion: 0.38
Nodes (11): H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar(), H.st() (+3 more)

### Community 13 - "Generados.lua"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 14 - "NarradorLegendario.lua"
Cohesion: 0.33
Nodes (9): azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear(), L.crearAuto(), L.marcar() (+1 more)

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
Cohesion: 0.17
Nodes (21): C.cuerpoMuerto(), C.curar(), C.tickMinuto(), C.vigilar(), Mundo.actor(), Mundo.actorVivo(), Mundo.arreglarCarnet(), Mundo.cuerpoActor() (+13 more)

### Community 20 - "NarradorContactos.lua"
Cohesion: 0.05
Nodes (116): KC.menu(), KC.miConfianza(), Cal.calor(), Cal.dulces(), Cal.niebla(), Cal.st(), anotar(), avisarTodos() (+108 more)

### Community 21 - "NarradorObjetosServer.lua"
Cohesion: 0.43
Nodes (5): Mundo.crearMapa(), Mundo.crearMapaZona(), S.casillaConPared(), S.crearMapa(), S.zona()

### Community 22 - "NarradorObjetosServer.lua"
Cohesion: 0.42
Nodes (8): S.alComando(), S.favoresDisponibles(), S.pedirFavor(), F.def(), F.disponible(), F.idDe(), F.residente(), registrarFavor()

### Community 23 - "Ideas futuras: campamentos de supervivientes"
Cohesion: 0.11
Nodes (18): Brújula sigue a la cámara (hecho, falta probar en el juego), Diario en lápiz pasta azul (hecho, falta probar en el juego), Encuentros: llevar a la persona al campamento (hecho, falta probar), Estético, Fase 1: el campamento existe y crece, Fase 2: reservas y trueque, Fase 3: oficios, Fase 4: historia propia del campamento (+10 more)

### Community 24 - "Contratos.lua"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 25 - "Sous.lua"
Cohesion: 0.47
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 26 - "NarradorObjetos.lua"
Cohesion: 0.60
Nodes (3): anteponer(), O.ajustarArcos(), recorrerAcciones()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Motor.estado()` connect `NarradorMotor.lua` to `Mundo.horas`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `Motor.enviar`, `NarradorHuellas.lua`, `NarradorPasajeros.lua`, `NarradorContactos.lua`, `NarradorObjetosServer.lua`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 56 inferred relationships involving `Motor.estado()` (e.g. with `A.st()` and `Cal.corteLuz()`) actually correct?**
  _`Motor.estado()` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Should `NarradorMotor.lua` be split into smaller, more focused modules?**
  _Cohesion score 0.06638655462184874 - nodes in this community are weakly interconnected._
- **Why does `Mundo.horas()` connect `Mundo.horas` to `NarradorMotor.lua`, `NarradorConversas.lua`, `NarradorMundo.lua`, `NarradorCuraServer.lua`, `Motor.enviar`, `NarradorHuellas.lua`, `NarradorContactos.lua`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 74 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 74 INFERRED edges - model-reasoned connections that need verification._
- **Should `Mundo.horas` be split into smaller, more focused modules?**
  _Cohesion score 0.06092073381793008 - nodes in this community are weakly interconnected._
- **Why does `S.comprar()` connect `NarradorContactos.lua` to `NarradorMotor.lua`, `NarradorMundo.lua`, `Mundo.horas`, `NarradorLegendario.lua`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._