import { supabase } from './supabase';
import { University, Specialty, ProgramCatalogItem } from '../types';

/**
 * Helper to parse city from institution address or location
 */
export const extractCity = (address: string): string => {
  if (!address) return 'თბილისი';
  const cleanAddr = address.trim();
  
  if (cleanAddr.includes('თბილისი')) return 'თბილისი';
  if (cleanAddr.includes('ბათუმი')) return 'ბათუმი';
  if (cleanAddr.includes('ქუთაისი')) return 'ქუთაისი';
  if (cleanAddr.includes('თელავი')) return 'თელავი';
  if (cleanAddr.includes('გორ')) return 'გორი';
  if (cleanAddr.includes('ზუგდიდი')) return 'ზუგდიდი';
  if (cleanAddr.includes('ახალციხე')) return 'ახალციხე';
  if (cleanAddr.includes('რუსთავი')) return 'რუსთავი';
  if (cleanAddr.includes('ფოთი')) return 'ფოთი';
  if (cleanAddr.includes('ოზურგეთი')) return 'ოზურგეთი';
  if (cleanAddr.includes('მცხეთა')) return 'მცხეთა';
  if (cleanAddr.includes('ხაშური')) return 'ხაშური';
  if (cleanAddr.includes('სამტრედია')) return 'სამტრედია';
  if (cleanAddr.includes('სენაკი')) return 'სენაკი';
  if (cleanAddr.includes('ქობულეთი')) return 'ქობულეთი';

  // Fallback: search for "ქ. " or "ქალაქი " pattern
  const cityMatch = cleanAddr.match(/(?:ქ\.|ქალაქი)\s*([ა-ჰ]+)/);
  if (cityMatch && cityMatch[1]) {
    return cityMatch[1];
  }

  return 'თბილისი';
};

/**
 * Helper to parse lat/lng from location string "lat, lng"
 */
export const parseCoordinates = (locStr: string): { lat: number; lng: number } => {
  const defaultCoords = { lat: 41.7151, lng: 44.8271 }; // Tbilisi default
  if (!locStr) return defaultCoords;
  
  const parts = locStr.split(',').map(s => parseFloat(s.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return defaultCoords;
};

/**
 * Sort institutions numerically/alphabetically by code e.g. #001, #002, #003...
 */
export const sortInstitutionsByCode = (list: University[]): University[] => {
  return [...list].sort((a, b) => {
    const numA = parseInt(String(a.code).replace(/[^0-9]/g, ''), 10) || 99999;
    const numB = parseInt(String(b.code).replace(/[^0-9]/g, ''), 10) || 99999;
    if (numA !== numB) return numA - numB;
    return String(a.code).localeCompare(String(b.code));
  });
};

// Cache for performance
let cachedInstitutions: University[] | null = null;
let cachedSpecialties: Specialty[] | null = null;

/**
 * Fetch all institutions (Universities & Colleges) with program counts, sorted by code
 */
export const fetchInstitutions = async (typeFilter?: 'უნივერსიტეტი' | 'კოლეჯი'): Promise<University[]> => {
  if (!cachedInstitutions) {
    const { data: uniData, error: uniError } = await supabase
      .from('universities')
      .select('*');

    if (uniError) {
      console.error('Error fetching universities from Supabase:', uniError);
      return [];
    }

    // Fetch program counts grouped by institution_code
    const allSpecsForCount = await fetchAllSpecialties();
    const countsMap: Record<string, number> = {};
    allSpecsForCount.forEach(item => {
      if (item.institution_code) {
        countsMap[item.institution_code] = (countsMap[item.institution_code] || 0) + 1;
      }
    });

    const mapped = (uniData || []).map((u: any) => {
      const coords = parseCoordinates(u.location);
      const city = extractCity(u.address);
      const progCount = countsMap[u.code] || countsMap[u.code.replace('#', '')] || 0;

      return {
        ...u,
        lat: coords.lat,
        lng: coords.lng,
        city,
        program_count: progCount
      };
    });

    cachedInstitutions = sortInstitutionsByCode(mapped);
  }

  if (typeFilter) {
    return cachedInstitutions.filter(u => u.type === typeFilter);
  }

  return cachedInstitutions;
};

/**
 * Fetch institution by its code (e.g. "#003", "#001", "#209")
 */
export const fetchInstitutionByCode = async (code: string): Promise<University | null> => {
  const all = await fetchInstitutions();
  const normalizedCode = code.startsWith('#') ? code : `#${code}`;
  
  const found = all.find(u => u.code === code || u.code === normalizedCode || u.code.replace('#', '') === code.replace('#', ''));
  if (found) return found;

  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .or(`code.eq.${code},code.eq.${normalizedCode}`)
    .maybeSingle();

  if (error || !data) return null;

  const coords = parseCoordinates(data.location);
  const city = extractCity(data.address);
  return {
    ...data,
    lat: coords.lat,
    lng: coords.lng,
    city
  };
};

/**
 * Fetch specialties/programs for a specific institution code
 */
export const fetchSpecialtiesByInstitutionCode = async (institutionCode: string): Promise<Specialty[]> => {
  const allSpecs = await fetchAllSpecialties();
  const cleanCode = institutionCode.replace('#', '');
  return allSpecs.filter(s => {
    const sCode = (s.institution_code || '').replace('#', '');
    return sCode === cleanCode;
  });
};

/**
 * Fetch ALL 1000+ specialties from Supabase in batch pages without 1000-row limit
 */
export const fetchAllSpecialties = async (): Promise<Specialty[]> => {
  if (cachedSpecialties) return cachedSpecialties;

  let allSpecs: Specialty[] = [];
  const chunkSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .range(from, from + chunkSize - 1)
      .order('name');

    if (error) {
      console.error('Error fetching specialties chunk:', error);
      break;
    }

    if (data && data.length > 0) {
      allSpecs = allSpecs.concat(data);
      if (data.length < chunkSize) {
        hasMore = false;
      } else {
        from += chunkSize;
      }
    } else {
      hasMore = false;
    }
  }

  cachedSpecialties = allSpecs;
  return allSpecs;
};

/**
 * Fetch all 1000+ programs combined with institution details
 */
export const fetchAllProgramsWithInstitutions = async (): Promise<ProgramCatalogItem[]> => {
  const [institutions, specs] = await Promise.all([
    fetchInstitutions(),
    fetchAllSpecialties()
  ]);

  const instMap = new Map<string, University>();
  
  institutions.forEach(inst => {
    instMap.set(inst.code, inst);
    if (inst.code.startsWith('#')) {
      instMap.set(inst.code.replace('#', ''), inst);
    }
  });

  return specs.map((spec: any) => {
    const inst = instMap.get(spec.institution_code) || instMap.get(`#${spec.institution_code}`);
    return {
      ...spec,
      institution_name: inst?.name || 'უცნობი დაწესებულება',
      institution_logo: inst?.logo_url || '',
      institution_type: inst?.type || 'უნივერსიტეტი',
      institution_location: inst?.address || '',
      institution_city: inst?.city || extractCity(inst?.address || '')
    };
  });
};
