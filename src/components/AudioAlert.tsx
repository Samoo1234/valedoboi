import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/client';

interface AudioAlertProps {
  // Opcionalmente, podemos receber props para personalizar o comportamento
  volume?: number; // Volume de 0 a 1
  enabled?: boolean; // Se o alerta está ativado
}

// Componente que monitora novos pedidos e toca um alerta sonoro
const AudioAlert = ({ volume = 0.9, enabled = true }: AudioAlertProps) => {
  // Referência para o elemento de áudio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Estado para rastrear se o arquivo de áudio foi carregado
  const [isLoaded, setIsLoaded] = useState(false);
  // Estado para mostrar um erro se o arquivo não estiver disponível
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Configurar o volume quando o componente for montado ou o volume mudar
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  useEffect(() => {
    // Se o componente estiver desabilitado, não configurar a assinatura
    if (!enabled) return;
    
    // Função para tocar o alerta
    const playAlert = () => {
      if (audioRef.current && isLoaded) {
        audioRef.current.currentTime = 0; // Reiniciar o áudio se estiver tocando
        audioRef.current.play()
          .catch(err => {
            console.error('Erro ao tocar alerta sonoro:', err);
            setError('Não foi possível tocar o alerta sonoro. Verifique se o arquivo existe e se seu navegador permite reprodução de áudio.');
          });
        console.log('Novo pedido recebido! Tocando alerta sonoro.');
      }
    };
    
    // Criar assinatura para monitorar inserções na tabela 'pedidos'
    const subscription = supabase
      .channel('orders-alert-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'pedidos' }, 
        () => {
          // Quando um novo pedido for inserido, tocar o som
          playAlert();
        }
      )
      .subscribe();
    
    // Limpar a assinatura quando o componente for desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, isLoaded]);
  
  // Função para lidar com o carregamento do áudio
  const handleAudioLoaded = () => {
    setIsLoaded(true);
    setError(null);
    console.log('Arquivo de áudio de alerta carregado com sucesso');
  };
  
  // Função para lidar com erros de carregamento
  const handleAudioError = () => {
    setIsLoaded(false);
    setError('Não foi possível carregar o arquivo de áudio de alerta. Verifique se o arquivo existe na pasta public.');
    console.error('Erro ao carregar arquivo de áudio');
  };
  
  return (
    <>
      <audio 
        ref={audioRef} 
        src="/alert.mp3" // Caminho para o arquivo de áudio
        preload="auto" 
        onCanPlayThrough={handleAudioLoaded}
        onError={handleAudioError}
        style={{ display: 'none' }} // Ocultar o elemento de áudio
      />
      {error && <div className='hidden'>{/* Erro silencioso, apenas para logs */}</div>}
    </>
  );
};

export default AudioAlert;
