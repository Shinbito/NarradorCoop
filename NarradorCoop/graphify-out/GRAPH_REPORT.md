# Graph Report - NarradorCoop  (2026-10-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1131 nodes · 3500 edges · 52 communities (42 shown, 10 thin omitted)
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 1233 edges (avg confidence: 0.85)
- Token cost: 31,506 input · 677 output

## Graph Freshness
- Built from commit: `8c634489`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Threat and Horde Spawning
- Contacts and Encargos Dialogue
- World Utility Helpers
- Client Conversation UI
- Pills and Healing
- Journal Diary UI
- Camp Spawning and Guards
- Footprints and Fame Titles
- Ambient NPC Conversations
- Camp Client and Fallen Tracking
- Client Entry and Menus
- Bandit Arc Story
- Screen Indicators Panel
- Chapter Arc Definitions
- Compass Arrow Calculations
- Engine Stage Dialogue
- Maps and Encounters
- Lore Text Content
- Client Server Commands
- Consequences and Contacts State
- Calendar Events
- Generated Missions
- Sous Base Furnishing
- Immoral Arcs
- Contract Missions
- Sous and Meulen Arcs
- Item Objects Registry
- Bell NPC Behavior
- Vehicle Passengers
- Narrator Engine Core
- Java Viewpoint Reflection
- Resident Chatter Engine
- ALife World Integration
- Engine Group Management
- Building Occupations
- Zone Cleanup and Safety
- Conversation Server Commands
- Engine Action Execution
- Sous Stories Part Two
- Doors and Mannequins
- Sous Stories Part One
- Repair Client Menu
- Eduardo Resident NPC
- Legendary Weapons
- Sous Stories Item Creation
- Location Search Helpers
- Legendary Weapon Repair

## God Nodes (most connected - your core abstractions)
1. `Motor.estado()` - 139 edges
2. `Mundo.horas()` - 106 edges
3. `Mundo.azar()` - 72 edges
4. `Mundo.log()` - 62 edges
5. `Mundo.jugadores()` - 47 edges
6. `Motor.enviar()` - 44 edges
7. `Mundo.grupoDe()` - 40 edges
8. `Motor.publicar()` - 39 edges
9. `Mundo.jugadorCerca()` - 37 edges
10. `Motor.iniciar()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CO.estanque()` --calls--> `Mundo.llenarBencina()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorConsecuencias.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `C.enterrar()` --calls--> `Mundo.quitarCadaver()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorContactos.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `CS.repasoCura()` --calls--> `Cura.infectado()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorCuraServer.lua → 42/media/lua/shared/Narrador/NarradorCura.lua
- `Motor.vistaObjetivo()` --calls--> `Mundo.horas()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorMotor.lua → 42/media/lua/server/Narrador/NarradorMundo.lua
- `Mundo.perdonarFaccion()` --calls--> `Mundo.jugadores()`  [INFERRED]
  42/media/lua/server/Narrador/NarradorMundoALife.lua → 42/media/lua/server/Narrador/NarradorMundo.lua

## Import Cycles
- None detected.

## Communities (52 total, 10 thin omitted)

### Community 0 - "Threat and Horde Spawning"
Cohesion: 0.05
Nodes (94): A.activas(), A.agrupar(), A.direccionTexto(), A.elegirTipo(), A.intervalo(), A.lanzar(), A.presupuesto(), A.programar() (+86 more)

### Community 1 - "Contacts and Encargos Dialogue"
Cohesion: 0.09
Nodes (75): avisarTodos(), Cal.ultimaNoche(), S.nivelConfianza(), S.seguirAtaque(), C.darMapa(), C.decir(), C.def(), C.elegirEncargo() (+67 more)

### Community 2 - "World Utility Helpers"
Cohesion: 0.12
Nodes (11): contarTipos(), Mundo.buscarItems(), Mundo.datosGuardados(), Mundo.enviarCliente(), Mundo.esNpc(), Mundo.llenarBencina(), Mundo.oleada(), Mundo.quitarCadaver() (+3 more)

### Community 3 - "Client Conversation UI"
Cohesion: 0.06
Nodes (72): Cliente.enviar(), ahora(), arcoPorId(), Conv.abrir(), Conv.abrirMisiones(), Conv.alCambiarResolucion(), Conv.altoFuente(), Conv.cambiarSeguir() (+64 more)

### Community 4 - "Pills and Healing"
Cohesion: 0.15
Nodes (13): Cura.examinar(), Cura.menuInventario(), nivelMedicina(), CS.falta(), CS.st(), CS.vista(), Cura.curar(), Cura.dolor() (+5 more)

### Community 5 - "Journal Diary UI"
Cohesion: 0.08
Nodes (48): agregar(), cerrada(), cerradas(), dentro(), Diario.abrir(), Diario.acomodarIcono(), Diario.alCambiarResolucion(), Diario.alternar() (+40 more)

### Community 6 - "Camp Spawning and Guards"
Cohesion: 0.12
Nodes (38): anotar(), avisarTodos(), banderasGuardia(), esCaja(), esMunicion(), esRopaSuelta(), mejorar(), porValor() (+30 more)

### Community 7 - "Footprints and Fame Titles"
Cohesion: 0.12
Nodes (27): H.alTerminar(), H.anunciarTitulo(), H.completarHuella(), H.estadoTexto(), H.fama(), H.gruposDe(), H.registrar(), H.st() (+19 more)

### Community 8 - "Ambient NPC Conversations"
Cohesion: 0.11
Nodes (30): calza(), claveZona(), CS.activaCerca(), CS.avanzar(), CS.charlaPausada(), CS.duracion(), CS.elegible(), CS.empezar() (+22 more)

### Community 9 - "Camp Client and Fallen Tracking"
Cohesion: 0.09
Nodes (30): KC.despreciado(), KC.menu(), KC.menuCatalogo(), KC.miConfianza(), KC.textoReservas(), CA.anotar(), CA.anotarContacto(), CA.revisar() (+22 more)

### Community 10 - "Client Entry and Menus"
Cohesion: 0.09
Nodes (24): Cliente.abrirDiario(), Cliente.abrirRegistro(), Cliente.alIniciar(), Cliente.cuerpoDe(), Cliente.engancharMapa(), Cliente.esAdmin(), Cliente.menu(), Cliente.miEncargo() (+16 more)

### Community 11 - "Bandit Arc Story"
Cohesion: 0.15
Nodes (5): finalRedimido(), J(), llegarAlPatio(), pereiraEnPatio(), KD.tono()

### Community 12 - "Screen Indicators Panel"
Cohesion: 0.12
Nodes (18): Ind.actualizarPaneles(), Ind.alTick(), Ind.buscarApiVP(), Ind.crear(), Ind.diagnostico(), Ind.hayViewpoint(), Ind.leer(), Ind.mirada() (+10 more)

### Community 14 - "Compass Arrow Calculations"
Cohesion: 0.24
Nodes (14): Ind.aPantalla(), NarradorBrujula:render(), NarradorFlecha:actualizar(), NarradorFlecha:render(), IC.alBorde(), IC.anguloIso(), IC.color(), IC.distancia() (+6 more)

### Community 15 - "Engine Stage Dialogue"
Cohesion: 0.23
Nodes (16): C.encargosActivos(), Motor.anotar(), Motor.decir(), Motor.elegir(), Motor.entrar(), Motor.opcionVisible(), Motor.radioEtapa(), Motor.revisarMensajero() (+8 more)

### Community 16 - "Maps and Encounters"
Cohesion: 0.07
Nodes (39): apiSimbolos(), datosDe(), fuenteTexto(), imagenEncima(), M.enganchar(), M.engancharISMap(), M.iniciarMapa(), M.menu() (+31 more)

### Community 18 - "Lore Text Content"
Cohesion: 0.18
Nodes (6): Motor.loreTexto(), Motor.vistaLore(), Lore.de(), Lore.etapa(), Lore.final(), Lore.intro()

### Community 19 - "Client Server Commands"
Cohesion: 0.21
Nodes (13): Cliente.actualizarNpcs(), Cliente.alComandoServidor(), Cliente.avisarPreguntas(), Cliente.cartel(), Cliente.decir(), Cliente.halo(), Cliente.marcar(), Cliente.ponerMarcas() (+5 more)

### Community 20 - "Consequences and Contacts State"
Cohesion: 0.17
Nodes (20): S.enAtaque(), S.tick(), CO.arsenal(), C.cuerpoMuerto(), C.desbloqueado(), C.encargoActivo(), C.estado(), C.inmuneMurio() (+12 more)

### Community 21 - "Calendar Events"
Cohesion: 0.19
Nodes (18): Cal.amigoSecreto(), Cal.calor(), Cal.corteLuz(), Cal.eventosActivos(), Cal.fonda(), Cal.niebla(), Cal.residente(), Cal.sousAliados() (+10 more)

### Community 22 - "Generated Missions"
Cohesion: 0.42
Nodes (9): base(), buscar(), complicaciones(), enSitio(), entregarAlMisionero(), finales(), inicio(), plazo() (+1 more)

### Community 23 - "Sous Base Furnishing"
Cohesion: 0.13
Nodes (30): adentro(), alturaMesa(), anillos(), cabeMesa(), clave(), edificio(), esGrupoBase(), esSuelo() (+22 more)

### Community 24 - "Immoral Arcs"
Cohesion: 0.43
Nodes (5): finales(), plazo(), registrarInmoral(), viaje(), volver()

### Community 25 - "Contract Missions"
Cohesion: 0.73
Nodes (5): comunes(), encargoAlijo(), encargoBuscar(), encargoRescate(), salidasDePlazo()

### Community 26 - "Sous and Meulen Arcs"
Cohesion: 0.28
Nodes (3): esconditeComun(), etapasEscuadras(), perfilesDe()

### Community 27 - "Item Objects Registry"
Cohesion: 0.60
Nodes (3): anteponer(), O.ajustarArcos(), recorrerAcciones()

### Community 28 - "Bell NPC Behavior"
Cohesion: 0.27
Nodes (14): avisarCerca(), B.aparecer(), B.huir(), B.limpiarCasa(), B.peligro(), B.rondar(), B.rondarHistoria(), B.sacar() (+6 more)

### Community 32 - "Vehicle Passengers"
Cohesion: 0.17
Nodes (23): Mundo.actorVivo(), alLado(), enAuto(), jugadorPorNombre(), P.agregar(), P.bajar(), P.esAcompanante(), P.lista() (+15 more)

### Community 33 - "Narrator Engine Core"
Cohesion: 0.14
Nodes (17): hayContadorDeBajas(), Motor.alComando(), Motor.avisarContador(), Motor.contarBajas(), Motor.darMapaZona(), Motor.forzarEtapa(), Motor.infoAdmin(), Motor.migrar() (+9 more)

### Community 35 - "Resident Chatter Engine"
Cohesion: 0.32
Nodes (11): S.hablar(), Motor.distanciaAGrupo(), Motor.vacia(), lineasDe(), Motor.charlaElegir(), Motor.charlar(), Motor.decirUid(), Motor.hacerResidentes() (+3 more)

### Community 36 - "ALife World Integration"
Cohesion: 0.17
Nodes (14): Motor.actualizarPropios(), Motor.onNpcMuerto(), Mundo.esJugador(), mismasBanderas(), Mundo.acompanar(), Mundo.arreglarCarnet(), Mundo.asesinoALife(), Mundo.banderas() (+6 more)

### Community 37 - "Engine Group Management"
Cohesion: 0.19
Nodes (18): Motor.avisar(), Motor.cantidad(), Motor.copiar(), Motor.sortear(), Motor.diferir(), Motor.acompanarGrupo(), Motor.banderasDe(), Motor.banderasGrupo() (+10 more)

### Community 38 - "Building Occupations"
Cohesion: 0.23
Nodes (18): casillaAfuera(), clave(), O.activo(), O.clasificar(), O.contar(), O.darBotin(), O.decorar(), O.deMisionero() (+10 more)

### Community 39 - "Zone Cleanup and Safety"
Cohesion: 0.24
Nodes (10): C.cuerpoRoto(), C.curar(), C.limpiar(), C.zonaSegura(), Motor.zonaSegura(), Mundo.jugadorCerca(), Mundo.quitarZombis(), Mundo.cuerpoActor() (+2 more)

### Community 40 - "Conversation Server Commands"
Cohesion: 0.31
Nodes (9): listasDe(), S.alComando(), S.completarArco(), S.elegirLinea(), S.frase(), S.nombreDe(), S.residentesInfo(), S.rolDeOpcion() (+1 more)

### Community 41 - "Engine Action Execution"
Cohesion: 0.17
Nodes (15): C.reponerUnaVez(), Motor.cancelar(), Motor.procesarPendientes(), Motor.quitarDelEstado(), Motor.tickArco(), Motor.valor(), Motor.copiarPlano(), Motor.ejecutar() (+7 more)

### Community 43 - "Doors and Mannequins"
Cohesion: 0.18
Nodes (17): abierta(), C.anotarPuertas(), C.cajaEdificio(), C.curarPuertas(), C.recorrerEdificio(), C.reponerEdificio(), esNorte(), nombreSprite() (+9 more)

### Community 46 - "Eduardo Resident NPC"
Cohesion: 0.27
Nodes (12): C.aparecer(), C.reponer(), ED.aparecer(), ED.corresponde(), ED.enHistoria(), ED.sigueme(), ED.st(), ED.tick() (+4 more)

### Community 47 - "Legendary Weapons"
Cohesion: 0.28
Nodes (11): C.armaKit(), H.crearArma(), azar(), crearItem(), es(), L.alEquipar(), L.aplicar(), L.crear() (+3 more)

### Community 48 - "Sous Stories Item Creation"
Cohesion: 0.26
Nodes (11): H.crearArma(), H.crearArmas(), H.disponible(), H.ocupado(), H.revisar(), Mundo.crearItem(), Mundo.crearMapa(), Mundo.crearMapaZona() (+3 more)

### Community 49 - "Location Search Helpers"
Cohesion: 0.31
Nodes (11): C.ubicar(), calza(), centro(), elegirSala(), Mundo.buscarCercaDe(), Mundo.buscarEnPueblo(), Mundo.buscarLugar(), Mundo.describir() (+3 more)

### Community 50 - "Legendary Weapon Repair"
Cohesion: 0.28
Nodes (8): Cal.dulces(), S.forjar(), Mundo.darItem(), Mundo.esAdmin(), Mundo.esServidor(), Mundo.quitarItem(), buscar(), RL.reparar()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Defs.get()` connect `Engine Stage Dialogue` to `Threat and Horde Spawning`, `Contacts and Encargos Dialogue`, `Narrator Engine Core`, `Resident Chatter Engine`, `Footprints and Fame Titles`, `Conversation Server Commands`, `Zone Cleanup and Safety`, `Chapter Arc Definitions`, `Maps and Encounters`, `Sous Stories Item Creation`, `Consequences and Contacts State`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `Motor.estado()` connect `Consequences and Contacts State` to `Threat and Horde Spawning`, `Contacts and Encargos Dialogue`, `World Utility Helpers`, `Pills and Healing`, `Camp Spawning and Guards`, `Footprints and Fame Titles`, `Ambient NPC Conversations`, `Camp Client and Fallen Tracking`, `Engine Stage Dialogue`, `Maps and Encounters`, `Calendar Events`, `Sous Base Furnishing`, `Bell NPC Behavior`, `Vehicle Passengers`, `Narrator Engine Core`, `Resident Chatter Engine`, `ALife World Integration`, `Engine Group Management`, `Building Occupations`, `Conversation Server Commands`, `Engine Action Execution`, `Eduardo Resident NPC`, `Sous Stories Item Creation`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `Mundo.horas()` connect `Threat and Horde Spawning` to `Contacts and Encargos Dialogue`, `World Utility Helpers`, `Pills and Healing`, `Camp Spawning and Guards`, `Footprints and Fame Titles`, `Ambient NPC Conversations`, `Camp Client and Fallen Tracking`, `Engine Stage Dialogue`, `Maps and Encounters`, `Consequences and Contacts State`, `Calendar Events`, `Sous Base Furnishing`, `Bell NPC Behavior`, `Narrator Engine Core`, `Resident Chatter Engine`, `ALife World Integration`, `Engine Group Management`, `Building Occupations`, `Zone Cleanup and Safety`, `Engine Action Execution`, `Eduardo Resident NPC`, `Sous Stories Item Creation`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 120 inferred relationships involving `Motor.estado()` (e.g. with `A.programar()` and `A.st()`) actually correct?**
  _`Motor.estado()` has 120 INFERRED edges - model-reasoned connections that need verification._
- **Are the 105 inferred relationships involving `Mundo.horas()` (e.g. with `A.elegirTipo()` and `A.lanzar()`) actually correct?**
  _`Mundo.horas()` has 105 INFERRED edges - model-reasoned connections that need verification._
- **Are the 62 inferred relationships involving `Mundo.azar()` (e.g. with `A.elegirTipo()` and `A.intervalo()`) actually correct?**
  _`Mundo.azar()` has 62 INFERRED edges - model-reasoned connections that need verification._
- **Are the 60 inferred relationships involving `Mundo.log()` (e.g. with `A.lanzar()` and `BA.consecuenciaUltimo()`) actually correct?**
  _`Mundo.log()` has 60 INFERRED edges - model-reasoned connections that need verification._