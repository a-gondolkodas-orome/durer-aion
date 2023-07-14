import { atom, useRecoilState } from 'recoil';
import { useEffect } from 'react';
import { TeamModelDto } from '../dto/TeamStateDto';
import { UserModel } from './user-model';

const RECOIL_KEY = 'team_status';

export const currentStateAtom = atom<TeamModelDto | null>({
    key: RECOIL_KEY,
    default: null
});

export const LoadUTeamState = () => {
    const [teamState, setTeamState] = useRecoilState(currentStateAtom);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const userModel = new UserModel();

        userModel
            .getTeamState()
            .then(teamState => {
              console.log('New teamState:', teamState);
              setTeamState(teamState);
            });

        
            userModel.addListener(setTeamState);
    }, []);


    return null;
};
