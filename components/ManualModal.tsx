

import React from 'react';
import { ChevronLeftIcon } from './Icons';

interface ManualModalProps {
    onClose: () => void;
}

const IllustrationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="my-4 p-4 rounded-xl bg-black/20 flex items-center justify-center">
        {children}
    </div>
);

const IllustrationMainControls = () => (
    <svg width="240" height="120" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="10" width="200" height="60" rx="12" fill="rgba(255,255,255,0.1)"/>
        <text x="120" y="48" fontFamily="monospace" fontSize="24" fill="white" textAnchor="middle">120</text>
        <path d="M25 40L20 45L25 50" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M215 40L220 45L215 50" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <g transform="translate(20, 75)">
            <circle cx="25" cy="15" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
            <path d="M 25 0 A 15 15 0 0 1 37.5 25" fill="none" stroke="var(--strong-beat-accent)" strokeWidth="3" strokeLinecap="round"/>
            <text x="25" y="20" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">4</text>
        </g>
        <g transform="translate(160, 75)">
            <circle cx="25" cy="15" r="15" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
            <path d="M 25 0 A 15 15 0 0 1 37.5 25" fill="none" stroke="var(--secondary-accent)" strokeWidth="3" strokeLinecap="round"/>
            <text x="25" y="20" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">4</text>
        </g>
    </svg>
);


const IllustrationSequencer = () => (
    <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
            <circle cx="50" cy="40" r="10" fill="var(--strong-beat-accent)"/>
            <circle cx="80" cy="40" r="10" fill="rgba(255,255,255,0.1)"/>
            <circle cx="50" cy="70" r="10" fill="var(--secondary-accent)"/>
            <circle cx="80" cy="70" r="10" fill="rgba(255,255,255,0.1)"/>
        </g>
        <path d="M115 65C135 85 155 85 175 65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M170 60L175 65L170 70" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <g>
            <rect x="150" y="30" width="60" height="12" rx="4" fill="rgba(255,255,255,0.1)"/>
            <rect x="150" y="50" width="60" height="12" rx="4" fill="rgba(255,255,255,0.1)"/>
            <rect x="150" y="70" width="40" height="12" rx="4" fill="rgba(255,255,255,0.1)"/>
        </g>
    </svg>
);

const IllustrationSetlists = () => (
    <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="10" width="200" height="30" rx="8" fill="rgba(255,255,255,0.15)"/>
        <path d="M195 20L205 25L195 30V20Z" fill="var(--primary-accent)"/>
        <rect x="30" y="20" width="80" height="10" rx="3" fill="rgba(255,255,255,0.4)"/>
        <rect x="20" y="45" width="200" height="30" rx="8" fill="rgba(255,255,255,0.1)"/>
        <path d="M195 55L205 60L195 65V55Z" fill="white" fillOpacity="0.5"/>
        <rect x="30" y="55" width="100" height="10" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="20" y="80" width="200" height="30" rx="8" fill="rgba(255,255,255,0.1)"/>
        <path d="M195 90L205 95L195 100V90Z" fill="white" fillOpacity="0.5"/>
        <rect x="30" y="90" width="60" height="10" rx="3" fill="rgba(255,255,255,0.3)"/>
    </svg>
);

const IllustrationQuickSongs = () => (
    <svg width="240" height="60" viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="20" fill="rgba(255,255,255,0.1)"/>
        <text x="30" y="35" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">4/4</text>
        <circle cx="90" cy="30" r="20" fill="rgba(255,255,255,0.1)"/>
        <text x="90" y="35" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">3/4</text>
        <circle cx="150" cy="30" r="20" fill="rgba(255,255,255,0.1)"/>
        <text x="150" y="35" fontFamily="monospace" fontSize="12" fill="white" textAnchor="middle">7/8</text>
        <circle cx="210" cy="30" r="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4 4"/>
        <path d="M205 30H215" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M210 25V35" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const IllustrationMixer = () => (
    <svg width="240" height="80" viewBox="0 0 240 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="10" width="40" height="60" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="40" y="30" width="40" height="40" rx="8" fill="var(--strong-beat-accent)"/>
        <rect x="100" y="10" width="40" height="60" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="100" y="40" width="40" height="30" rx="8" fill="var(--secondary-accent)"/>
        <rect x="160" y="10" width="40" height="60" rx="8" fill="rgba(255,255,255,0.1)"/>
        <rect x="160" y="20" width="40" height="50" rx="8" fill="rgba(255,255,255,0.5)"/>
    </svg>
);

const IllustrationAccount = () => (
    <svg width="240" height="100" viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M165 70C184.33 70 200 54.33 200 35C200 15.67 184.33 0 165 0C148.87 0 135.25 10.15 130.69 24.03C129.13 23.73 127.59 23.5 126 23.5C109.43 23.5 96 36.93 96 53.5C96 55.03 96.22 56.5 96.63 57.92C82.44 61.35 72 74.62 72 90H165C165 80.61 165 70 165 70Z" transform="translate(20, 5)" fill="rgba(255,255,255,0.1)"/>
        <path d="M140 45 L160 25 L180 45" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M160 27 V 75" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <rect x="40" y="30" width="80" height="10" rx="3" fill="rgba(255,255,255,0.4)"/>
        <rect x="40" y="50" width="80" height="10" rx="3" fill="rgba(255,255,255,0.3)"/>
        <rect x="40" y="70" width="60" height="10" rx="3" fill="rgba(255,255,255,0.3)"/>
    </svg>
);


const ManualSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 pb-2 border-b border-white/10">{title}</h3>
        {children}
    </section>
);

const Em: React.FC<{children: React.ReactNode}> = ({children}) => <span className="font-bold text-[var(--primary-accent)]">{children}</span>

const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
    return (
        <main className="flex-1 w-full overflow-y-auto animate-panel">
            <div className="w-full max-w-[380px] mx-auto flex flex-col gap-4 px-[15px] py-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)'}}>
                
                <header className="w-full h-10 flex items-center justify-between sticky top-0 bg-[var(--bg-color)]/80 backdrop-blur-sm z-10 -mt-2 pt-2">
                    <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to metronome">
                        <ChevronLeftIcon />
                    </button>
                    <h2 className="text-xl font-bold">User Manual</h2>
                    <div className="w-6" /> {/* Spacer for centering title */}
                </header>

                <div className="w-full bg-[var(--container-bg)] backdrop-blur-lg border border-[var(--container-border)] rounded-3xl p-5 flex flex-col">
                    
                    <ManualSection title="Main Controls">
                        <IllustrationWrapper><IllustrationMainControls /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p><Em>BPM Control:</Em> Ajusta el tempo arrastrando la gran pantalla central. Usa los botones <Em>+</Em> y <Em>-</Em> para ajustes finos. <Em>Mantén presionado</Em> el número para escribir un valor. Si está habilitado en los ajustes, también puedes <Em>tocar la pantalla</Em> para establecer el tempo.</p>
                            <p><Em>Controles de Ritmo:</Em> Los tres diales circulares debajo del BPM ajustan el ritmo. Arrastra hacia arriba/derecha para aumentar el valor, y hacia abajo/izquierda para disminuirlo. Controlan los <Em>Pulsos</Em> por compás, las <Em>Subdivisiones</Em> por pulso, y la cantidad de <Em>Swing</Em>.</p>
                            <p><Em>Play/Pause:</Em> El gran botón circular en el centro inicia y detiene el metrónomo. Este botón se oculta cuando una lista de canciones está activa; en su lugar, usa la barra del reproductor inferior.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="The Sequencer">
                        <IllustrationWrapper><IllustrationSequencer /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>El secuenciador es un componente que se puede girar. La cara frontal muestra un editor simple de un solo compás, mientras que la parte posterior revela el potente Secuenciador Avanzado de múltiples compases.</p>
                            <p><Em>Vista Simple:</Em> Crea un patrón tocando los pasos. Puedes cambiar entre una vista clásica de <Em>Rejilla</Em> y una vista circular de <Em>Anillo</Em> usando los botones de la parte inferior.</p>
                            <p><Em>Vista Avanzada:</Em> Toca "Sec. Avanzado" para darle la vuelta. Aquí puedes construir una estructura de canción completa.
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Toca un compás para seleccionarlo y editarlo. Sus parámetros (BPM, sonidos, etc.) y su patrón de pasos aparecerán a continuación.</li>
                                    <li>Cuando se selecciona un solo compás, aparece un icono de <Em>Dado</Em>. Tócalo para generar un nuevo patrón aleatorio para ese compás específico.</li>
                                    <li>Usa el botón de <Em>Editar</Em> para entrar en el modo de selección múltiple para eliminar o reordenar varios compases a la vez.</li>
                                    <li>Habilita <Em>Compás de Entrada</Em> para añadir un compás de preparación, y <Em>Bucle</Em> para repetir la secuencia.</li>
                                </ul>
                            </p>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Setlists & Songs">
                        <IllustrationWrapper><IllustrationSetlists /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Organiza tus canciones en listas para practicar o para tus presentaciones.</p>
                            <p><Em>Gestionar Listas:</Em> Desde la lista principal, toca una lista para ver sus canciones. Usa el icono de <Em>Editar</Em> para renombrar, reordenar, duplicar o eliminar listas.</p>
                            <p><Em>Gestionar Canciones:</Em> Dentro de una lista, toca una canción para cargarla. El botón de <Em>Play</Em> junto a una canción la cargará e iniciará la reproducción inmediatamente. Usa el icono de <Em>Editar</Em> para gestionar las canciones.</p>
                            <p><Em>Barra de Reproducción:</Em> Cuando una lista está activa, aparece una barra de reproducción en la parte inferior para navegar fácilmente entre las canciones anteriores y siguientes de la lista.</p>
                            <p><Em>Cambios sin Guardar:</Em> Si editas una canción cargada, aparecerán los botones de <Em>Guardar</Em> y <Em>Cancelar</Em>, permitiéndote confirmar tus cambios o revertirlos.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Quick Songs">
                        <IllustrationWrapper><IllustrationQuickSongs /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>La barra inferior proporciona acceso instantáneo a tus configuraciones favoritas y herramientas creativas.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li><Em>Ranuras Principales:</Em> <Em>Toca brevemente</Em> una ranura existente para cargar su configuración. <Em>Mantén presionada</Em> cualquier ranura (vacía o llena) para guardar la configuración actual del metrónomo. Una barra de progreso radial mostrará el progreso del guardado.</li>
                                <li><Em>Reiniciar:</Em> El icono de <Em>Casa</Em> a la izquierda del todo reinicia el metrónomo a su estado predeterminado.</li>
                                <li><Em>Aleatorizar:</Em> El icono de <Em>Dado</Em> a la derecha del todo genera un ritmo completamente nuevo y aleatorio, incluyendo el compás y el patrón.</li>
                            </ul>
                        </div>
                    </ManualSection>
                    
                    <ManualSection title="Mixer & Sounds">
                        <IllustrationWrapper><IllustrationMixer /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Toca los botones de <Em>Mezcla</Em> y <Em>Sonidos</Em> para revelar paneles para ajustar el audio.</p>
                            <p><Em>Panel de Mezcla:</Em> Ajusta el volumen de los pulsos de <Em>Acento</Em>, las <Em>Subdivisiones</Em>, y el volumen <Em>Maestro</Em> general.</p>
                            <p><Em>Panel de Sonidos:</Em> Elige diferentes kits de sonido para el Pulso principal y los clics de Subdivisión de forma independiente.</p>
                        </div>
                    </ManualSection>

                    <ManualSection title="Account & Syncing">
                        <IllustrationWrapper><IllustrationAccount /></IllustrationWrapper>
                        <div className="space-y-3 text-white/90 text-base leading-relaxed">
                            <p>Crea una cuenta gratuita para hacer una copia de seguridad y sincronizar tus listas de canciones y configuraciones en todos tus dispositivos. Accede a tu cuenta desde la página de <Em>Ajustes</Em>.</p>
                        </div>
                    </ManualSection>

                </div>
            </div>
        </main>
    );
};

export default ManualModal;
