import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, MapPin, Loader2 } from "lucide-react";

interface WeatherData {
  temp: string;
  condition: string;
  location: string;
  humidity: string;
  wind: string;
}

const conditionIcons: Record<string, typeof Sun> = {
  sunny: Sun, clear: Sun,
  cloudy: Cloud, overcast: Cloud, partly: Cloud,
  rain: CloudRain, heavy: CloudRain,
  drizzle: CloudDrizzle, light: CloudDrizzle,
  snow: CloudSnow, sleet: CloudSnow,
  thunder: CloudLightning, storm: CloudLightning,
};

const getIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  for (const [key, Icon] of Object.entries(conditionIcons)) {
    if (lower.includes(key)) return Icon;
  }
  return Cloud;
};

export const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("https://wttr.in/?format=j1", { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        const current = data.current_condition?.[0];
        const area = data.nearest_area?.[0];
        if (current && area) {
          setWeather({
            temp: current.temp_C,
            condition: current.weatherDesc?.[0]?.value ?? "Unknown",
            location: area.areaName?.[0]?.value ?? "Unknown",
            humidity: current.humidity,
            wind: current.windspeedKmph,
          });
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-sky-500/10 to-blue-500/5">
        <CardContent className="p-5 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading weather...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="border-0 bg-gradient-to-br from-sky-500/10 to-blue-500/5">
        <CardContent className="p-5 text-center text-sm text-muted-foreground">
          Unable to load weather data
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = getIcon(weather.condition);

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-500/10 to-blue-500/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15">
            <WeatherIcon className="h-7 w-7 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tabular-nums">{weather.temp}°</span>
              <span className="text-xs text-muted-foreground">C</span>
            </div>
            <p className="text-sm text-muted-foreground">{weather.condition}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <MapPin className="h-3 w-3" />
              <span>{weather.location}</span>
            </div>
            <p>💧 {weather.humidity}%</p>
            <p>💨 {weather.wind} km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
